import mongoose from 'mongoose'
import UserModel from './model.js'
import UserData from './data.js'
import Password from '../password/password.js'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import getFirstVal from '../../utils/get-first-val.js'

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
}

export default User
