import Content from '../content/content.js'
import ContentData from '../content/data.js'
import User from '../user/user.js'
import UserData from '../user/data.js'
import Permissions from '../permissions/permissions.js'
import PermissionsData from '../permissions/data.js'

interface RevisionConstructorOptions {
  content: Content | ContentData
  permissions?: Permissions | PermissionsData
  editor?: User | UserData
  msg?: string
  timestamp?: Date
}

class Revision {
  content: Content
  permissions: Permissions
  editor?: User
  msg: string
  timestamp: Date

  constructor (options: RevisionConstructorOptions) {
    this.content = new Content(options.content)
    this.permissions = new Permissions(options.permissions) ?? new Permissions()
    this.editor = options.editor?.constructor?.name === 'User'
      ? options.editor as User
      : new User(options.editor as UserData)
    this.msg = options.msg ?? ''
    this.timestamp = options.timestamp ?? new Date()
  }
}

export default Revision
