import mongoose from 'mongoose'
import { PermissionLevel } from '../permissions/data.js'
import PageData from './data.js'
import getFirstVal from '../../utils/get-first-val.js'
const { Schema, model } = mongoose
const { DEFAULT_READ_PERMISSIONS, DEFAULT_WRITE_PERMISSIONS } = process.env

const defaultRead = getFirstVal(DEFAULT_READ_PERMISSIONS, PermissionLevel.anyone)
const defaultWrite = getFirstVal(DEFAULT_WRITE_PERMISSIONS, PermissionLevel.anyone)

const schema = new Schema<PageData>({
  revisions: [{
    content: {
      title: String,
      path: String,
      body: String
    },
    editor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
