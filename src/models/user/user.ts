import mongoose from 'mongoose'
import UserModel from './model.js'
import UserData from './data.js'
import Password from '../password/password.js'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import getFirstVal from '../../utils/get-first-val.js'

interface UserConstructorOptions {
  active?: boolean
  admin?: boolean
  password?: string
}

class User {
  id?: string
  active: boolean
  admin: boolean
  password: Password
  emails: Email[]
  otp: OTP

  constructor (options?: UserConstructorOptions) {
    this.active = getFirstVal(options?.active, true)
    this.admin = getFirstVal(options?.admin, false)
    this.password = new Password(options?.password)
    this.emails = []
    this.otp = new OTP()
  }

  getObj (): UserData {
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

  static loadObject (record: UserData): User {
    const { active, admin, password } = record
    const user = new User({ active, admin })
    if (mongoose.isValidObjectId(record._id)) user.id = record._id?.toString()
    if (typeof password === 'string') user.password.hash = password
    user.emails = record.emails.map(data => new Email(data))
    user.otp.enabled = record.otp.enabled
    user.otp.secret = record.otp.secret
    return user
  }
}

export default User
