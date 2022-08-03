import mongoose from 'mongoose'

const getId = (obj: any): string | null => {
  const { _id, id } = obj
  if (_id === undefined && id === undefined) return null
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  if (_id !== undefined && mongoose.isValidObjectId(_id)) return _id.toString()
  if (typeof _id === 'string') return _id
  if (typeof id === 'string') return id
  return null
}

export default getId
