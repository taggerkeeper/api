import mongoose from 'mongoose'
const { Schema, model } = mongoose

interface IUser {
  _id?: string
  active: boolean
  admin: boolean
  password?: string
  emails: [
    {
      addr?: string
      verified: boolean
      code?: string
    }
  ]
  otp: {
    enabled: boolean
    secret?: string
  }
}

const schema = new Schema<IUser>({
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
          return val === false || (this as any).otp.secret !== undefined
        },
        message: () => 'You must have a secret before you can enable OTP.'
      }
    },
    secret: { type: String }
  }
})

const UserModel = model<IUser>('User', schema)

export default UserModel
export { IUser }
