import mongoose from 'mongoose'
import PageData from './data.js'
import FileSchema from '../file/model.js'
import getEnvVar from '../../utils/get-env-var.js'
const { Schema, model } = mongoose

const defaultRead = getEnvVar('DEFAULT_READ_PERMISSIONS')
const defaultWrite = getEnvVar('DEFAULT_WRITE_PERMISSIONS')

const schema = new Schema<PageData>({
  path: { type: String, required: true, unique: true },
  revisions: [{
    content: {
      title: String,
      path: String,
      body: String
    },
    file: FileSchema,
    thumbnail: FileSchema,
    editor: { type: Schema.Types.ObjectId, ref: 'User' },
    permissions: {
      read: { type: String, required: true, default: defaultRead },
      write: { type: String, required: true, default: defaultWrite }
    },
    msg: String
  }],
  created: { type: Date, required: true, default: () => Date.now() },
  updated: { type: Date, required: true, default: () => Date.now() },
  trashed: { type: Date, required: false }
})

schema.index({
  'revisions[0].content.title': 'text',
  'revisions[0].content.body': 'text'
}, {
  weights: {
    'revisions[0].content.title': 5,
    'revisions[0].content.body': 1
  }
})

const PageModel = model<PageData>('Page', schema)

export default PageModel
