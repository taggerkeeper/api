import Content from '../content/content.js'
import { isUserData } from '../user/data.js'
import User from '../user/user.js'
import Permissions from '../permissions/permissions.js'
import RevisionData from './data.js'
import PublicRevisionData from './public.js'

class Revision {
  content: Content
  permissions: Permissions
  editor?: User
  msg: string
  timestamp: Date

  constructor (data: RevisionData) {
    this.content = new Content(data.content)
    this.permissions = new Permissions(data.permissions) ?? new Permissions()
    this.msg = data.msg ?? ''
    this.timestamp = data.timestamp ?? new Date()
    if (data.editor !== undefined && isUserData(data.editor)) this.editor = new User(data.editor)
  }

  getObj (): RevisionData {
    const obj: RevisionData = {
      content: this.content.getObj(),
      permissions: this.permissions.getObj(),
      msg: this.msg,
      timestamp: this.timestamp
    }
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
    if (this.editor !== undefined) obj.editor = this.editor.getPublicObj()
    return obj
  }
}

export default Revision
