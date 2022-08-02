import mongoose from 'mongoose'
import SessionData from './data.js'
const { Schema, model } = mongoose

const schema = new Schema<SessionData>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
})

const SessionModel = model<SessionData>('Session', schema)

export default SessionModel
