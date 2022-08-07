import UserModel from './model.js'
import UserData from './data.js'
import PublicUserData from './public.js'
import Password from '../password/password.js'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import getFirstVal from '../../utils/get-first-val.js'
import getId from '../../utils/get-id.js'
import exists from '../../utils/exists.js'
import pickRandomElem from '../../utils/pick-random-elem.js'
import anonymousAnimals from '../../anonymous.json'

class User {
  id?: string
  name: string
  active: boolean
  admin: boolean
  password: Password
  emails: Email[]
  otp: OTP

  constructor (data?: UserData) {
    this.name = getFirstVal(data?.name, `Anonymous ${pickRandomElem(anonymousAnimals)}`)
    this.active = getFirstVal(data?.active, true)
    this.admin = getFirstVal(data?.admin, false)
    this.password = new Password()
    this.emails = []
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

  async save (): Promise<void> {
    if (this.id === undefined) {
      const record = await UserModel.create(this.getObj())
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      this.id = record._id?.toString()
    } else {
      await UserModel.findOneAndUpdate({ _id: this.id }, this.getObj())
    }
  }
}

export default User
