import UserModel from './model.js'
import Password from '../password/password.js'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import getValOrDefault from '../../utils/get-val-or-default.js'

interface UserConstructorOptions {
  active?: boolean
  admin?: boolean
  password?: string
}

interface UserObject {
  id?: string
  active: boolean
  admin: boolean
  password?: string
  emails: Email[]
  otp: {
    enabled: boolean
    secret?: string
  }
}

class User {
  id?: string
  active: boolean
  admin: boolean
  password: Password
  emails: Email[]
  otp: OTP

  constructor (options?: UserConstructorOptions) {
    this.active = getValOrDefault(options?.active, true)
    this.admin = getValOrDefault(options?.admin, false)
    this.password = new Password(options?.password)
    this.emails = []
    this.otp = new OTP()
  }

  getObj (): UserObject {
    return {
      id: this.id,
      active: this.active,
      admin: this.admin,
      password: this.password.hash,
      emails: this.emails,
      otp: {
        enabled: this.otp.enabled,
        secret: this.otp.secret
      }
    }
  }

  async save (): Promise<void> {
    if (this.id === undefined) {
      const record = await UserModel.create(this.getObj())
      this.id = record._id?.toString()
    } else {
      await UserModel.findOneAndUpdate({ _id: this.id }, this.getObj())
    }
  }
}

export default User
