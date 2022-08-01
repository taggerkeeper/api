import Content from '../content/content.js'
import User from '../user/user.js'
import Permissions from '../permissions/permissions.js'

interface IRevision {
  content: Content
  permissions?: Permissions
  editor?: User
  msg?: string
  timestamp?: Date
}

class Revision {
  content: Content
  permissions: Permissions
  editor?: User
  msg: string
  timestamp: Date

  constructor (options: IRevision) {
    this.content = options.content
    this.permissions = options.permissions ?? new Permissions()
    this.editor = options.editor
    this.msg = options.msg ?? ''
    this.timestamp = options.timestamp ?? new Date()
  }
}

export default Revision
export { IRevision }
