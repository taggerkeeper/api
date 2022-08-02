import mongoose from 'mongoose'
import UserData from './data.js'
const { Schema, model } = mongoose

const schema = new Schema<UserData>({
  active: { type: Boolean, default: true },
  admin: { type: Boolean, default: false },
  password: String,
  emails: [
    {
      addr: String,
      verified: Boolean,
      code: String
    }
  ],
  otp: {
    enabled: {
      type: Boolean,
      default: false,
      validate: {
        validator: function (val: boolean) {
          return !val || (this as any).otp.secret !== undefined
        },
        message: () => 'You must have a secret before you can enable OTP.'
      }
    },
    secret: { type: String }
  }
})

const UserModel = model<UserData>('User', schema)

export default UserModel
