import mongoose from 'mongoose'
const { Schema, model } = mongoose

interface IEmail {
  addr?: string
  verified: boolean
  code?: string
}

interface IUser {
  _id?: string
  active: boolean
  admin: boolean
  password?: string
  emails: IEmail[]
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
          return !val || (this as any).otp.secret !== undefined
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
