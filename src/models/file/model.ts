import mongoose from 'mongoose'
import FileData from './data.js'

const schema = new mongoose.Schema<FileData>({
  location: { required: true, type: String },
  key: { required: true, type: String },
  mime: { required: true, type: String },
  size: { required: true, type: Number }
})

export default schema
