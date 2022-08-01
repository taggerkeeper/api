import mongoose from 'mongoose'
import { PermissionLevel } from '../permissions/permissions.js'
import { IUser } from '../user/model.js'
import getFirstVal from '../../utils/get-first-val.js'
const { Schema, model } = mongoose
const { DEFAULT_READ_PERMISSIONS, DEFAULT_WRITE_PERMISSIONS } = process.env

const defaultRead = getFirstVal(DEFAULT_READ_PERMISSIONS, PermissionLevel.anyone)
const defaultWrite = getFirstVal(DEFAULT_WRITE_PERMISSIONS, PermissionLevel.anyone)

interface ContentRecord {
  title: string
  path?: string
  body: string
}

interface RevisionRecord {
  content: ContentRecord
  editor: IUser['_id'] | IUser
  permissions: {
    read: PermissionLevel
    write: PermissionLevel
  }
  msg: string
  timestamp: Date
}

interface PageRecord {
  revisions: RevisionRecord[]
  created: Date
  updated: Date
  trashed?: Date
}

const schema = new Schema<PageRecord>({
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

const PageModel = model<PageRecord>('Page', schema)

export default PageModel
export { ContentRecord, RevisionRecord, PageRecord }
