import Content from '../content/content.js'
import User from '../user/user.js'
import Permissions from '../permissions/permissions.js'

interface IRevision {
  content: Content
  editor: User
  permissions?: Permissions
  msg?: string
  timestamp?: Date
}

class Revision {
  content: Content
  editor: User
  permissions: Permissions
  msg: string
  timestamp: Date

  constructor (options: IRevision) {
    this.content = options.content
    this.editor = options.editor
    this.permissions = options.permissions ?? new Permissions()
    this.msg = options.msg ?? ''
    this.timestamp = options.timestamp ?? new Date()
  }
}

export default Revision
export { IRevision }
