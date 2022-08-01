import mongoose from 'mongoose'
import EmailData from '../email/data.js'
import { IUser } from '../user/model.js'
const { Schema, model } = mongoose

interface IPasswordReset {
  user: IUser['_id'] | IUser
  email: EmailData
  code: string
  expiration: Date
}

const schema = new Schema<IPasswordReset>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: {
    addr: { type: String, required: true },
    verified: { type: Boolean, require: true },
    code: String
  },
  code: {
    type: String,
    validate: {
      validator: function (val: string) {
        return val.length === 32
      },
      message: 'PasswordReset requires a cryptographically random 32-character code.'
    }
  },
  expiration: { type: Date, required: true }
})

const PasswordResetModel = model<IPasswordReset>('PasswordReset', schema)

export default PasswordResetModel
export { IPasswordReset }
