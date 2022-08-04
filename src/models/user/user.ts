import UserModel from './model.js'
import UserData from './data.js'
import Password from '../password/password.js'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import getFirstVal from '../../utils/get-first-val.js'
import getId from '../../utils/get-id.js'
import exists from '../../utils/exists.js'

class User {
  id?: string
  active: boolean
  admin: boolean
  password: Password
  emails: Email[]
  otp: OTP

  constructor (data?: UserData) {
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
