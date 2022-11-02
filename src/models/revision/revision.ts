import { diffWords, Change } from 'diff'
import Content from '../content/content.js'
import { isFileData } from '../file/data.js'
import File from '../file/file.js'
import diffFiles, { FilesDiff } from '../file/diff.js'
import { isUserData } from '../user/data.js'
import User from '../user/user.js'
import Permissions from '../permissions/permissions.js'
import RevisionData from './data.js'
import PublicRevisionData from './public.js'

interface RevisionsDiff {
  content: {
    title: Change[]
    path: Change[]
    body: Change[]
  }
  file: FilesDiff
  thumbnail: FilesDiff
  permissions: {
    read: Change[]
    write: Change[]
  }
}

class Revision {
  number?: number
  content: Content
  file?: File
  thumbnail?: File
  permissions: Permissions
  editor?: User
  msg: string
  timestamp: Date

  constructor (data: RevisionData) {
    this.content = new Content(data.content)
    this.permissions = new Permissions(data.permissions) ?? new Permissions()
    this.msg = data.msg ?? ''
    this.timestamp = data.timestamp ?? new Date()
    if (data.file !== undefined && isFileData(data.file)) this.file = new File(data.file)
    if (data.thumbnail !== undefined && isFileData(data.thumbnail)) this.thumbnail = new File(data.thumbnail)
    if (data.editor !== undefined && isUserData(data.editor)) this.editor = new User(data.editor)
  }

  getObj (): RevisionData {
    const obj: RevisionData = {
      content: this.content.getObj(),
      permissions: this.permissions.getObj(),
      msg: this.msg,
      timestamp: this.timestamp
    }
    if (this.file !== undefined) obj.file = this.file.getObj()
    if (this.thumbnail !== undefined) obj.file = this.thumbnail.getObj()
    if (this.editor !== undefined) obj.editor = this.editor.getObj()
    return obj
  }

  getPublicObj (): PublicRevisionData {
    const obj: PublicRevisionData = {
      content: this.content.getObj(),
      permissions: this.permissions.getObj(),
      msg: this.msg,
      timestamp: this.timestamp
    }
    if (this.file !== undefined) obj.file = this.file.getObj()
    if (this.thumbnail !== undefined) obj.file = this.thumbnail.getObj()
    if (this.editor !== undefined) obj.editor = this.editor.getPublicObj()
    return obj
  }

  diff (other: Revision): RevisionsDiff {
    return {
      content: {
        title: diffWords(this.content.title, other.content.title),
        path: diffWords(this.content.path, other.content.path),
        body: diffWords(this.content.body, other.content.body)
      },
      file: diffFiles(this.file, other.file),
      thumbnail: diffFiles(this.file, other.file),
      permissions: {
        read: diffWords(this.permissions.read, other.permissions.read),
        write: diffWords(this.permissions.write, other.permissions.write)
      }
    }
  }
}

export default Revision
export { RevisionsDiff }
