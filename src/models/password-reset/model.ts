import mongoose from 'mongoose'
import PasswordResetData from './data.js'
const { Schema, model } = mongoose

const schema = new Schema<PasswordResetData>({
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

const PasswordResetModel = model<PasswordResetData>('PasswordReset', schema)

export default PasswordResetModel
