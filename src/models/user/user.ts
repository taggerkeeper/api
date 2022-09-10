import cryptoRandomString from 'crypto-random-string'
import UserModel from './model.js'
import UserData from './data.js'
import PublicUserData from './public.js'
import Password from '../password/password.js'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import exists from '../../utils/exists.js'
import getAPIInfo from '../../utils/get-api-info.js'
import getEnvVar from '../../utils/get-env-var.js'
import getFirstVal from '../../utils/get-first-val.js'
import getId from '../../utils/get-id.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import signJWT from '../../utils/sign-jwt.js'

interface TokenSet {
  access: string
  refresh: string
  refreshExpires: number
  domain: string
}

class User {
  id?: string
  name: string
  active: boolean
  admin: boolean
  password: Password
  refresh?: string
  emails: Email[]
  otp: OTP

  constructor (data?: UserData) {
    this.name = getFirstVal(data?.name, UserModel.generateRandomName())
    this.active = getFirstVal(data?.active, true)
    this.admin = getFirstVal(data?.admin, false)
    this.password = new Password()
    this.refresh = data?.refresh
    this.emails = data?.emails?.map(data => new Email(data)) ?? []
    this.otp = new OTP(data?.otp)
    if (data?.password !== undefined) this.password.hash = data.password
    const id = getId(data)
    if (id !== null) this.id = id
  }

  getObj (): UserData {
    const obj: UserData = {
      name: this.name,
      active: this.active,
      admin: this.admin,
      password: this.password.hash,
      refresh: this.refresh,
      emails: this.emails.map(email => email.getObj()),
      otp: { enabled: this.otp.enabled }
    }
    if (exists(this.id)) obj.id = this.id
    if (exists(this.otp.secret)) obj.otp = { enabled: this.otp.enabled, secret: this.otp.secret }
    return obj
  }

  getPublicObj (): PublicUserData {
    return {
      id: this.id ?? '',
      name: this.name,
      active: this.active ?? true,
      admin: this.admin ?? false
    }
  }

  async generateTokens (): Promise<TokenSet> {
    const pkg = await loadPackage() as NPMPackage
    const { root, host } = getAPIInfo(pkg)
    const subject = `${root}/users/${this.id as string}`
    this.refresh = cryptoRandomString({ length: 64 })
    const refreshExpires = getEnvVar('REFRESH_EXPIRES') as number
    return {
      access: signJWT(this.getPublicObj(), subject, getEnvVar('JWT_EXPIRES') as number, pkg),
      refresh: signJWT({ uid: this.id, refresh: this.refresh }, subject, refreshExpires, pkg),
      refreshExpires,
      domain: host
    }
  }

  async save (): Promise<void> {
    if (this.id === undefined) {
      const record = await UserModel.create(this.getObj())
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      this.id = record._id?.toString()
    } else {
      await UserModel.findOneAndUpdate({ _id: this.id }, this.getObj(), { upsert: true })
    }
  }
}

export default User
export { TokenSet }
