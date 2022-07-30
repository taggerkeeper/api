import mongoose from 'mongoose'
import { IUser } from '../user/model.js'
const { Schema, model } = mongoose

interface ISession {
  _id?: string
  user: IUser['_id'] | IUser
}

const schema = new Schema<ISession>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
})

const SessionModel = model<ISession>('Session', schema)

export default SessionModel
export { ISession }
