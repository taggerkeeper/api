import mongoose from 'mongoose'
import User from '../user.js'
import UserModel from '../model.js'
const { isValid } = mongoose.Types.ObjectId

const loadUserByIdAndRefresh = async (id: string, refresh: string): Promise<User | null> => {
  try {
    if (!isValid(id)) return null
    const record = await UserModel.findOne({ id, refresh })
    return record === null ? null : new User(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadUserByIdAndRefresh
