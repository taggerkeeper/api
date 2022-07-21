import mongoose from 'mongoose'
import User from '../user.js'
import UserModel from '../model.js'
import loadUserFromRecord from './from-record.js'
const { isValid } = mongoose.Types.ObjectId

const loadUserById = async (id: string): Promise<User | null> => {
  try {
    if (!isValid(id)) return null
    const record = await UserModel.findById(id)
    return loadUserFromRecord(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadUserById
