import Content from '../content/content.js'
import User from '../user/user.js'
import Permissions from '../permissions/permissions.js'
import RevisionData from './data.js'

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
    if (data.editor !== undefined) this.editor = new User(data.editor)
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
}

export default Revision
