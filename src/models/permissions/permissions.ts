import User from '../user/user.js'
import Revision from '../revision/revision.js'
import exists from '../../utils/exists.js'
import getFirstVal from '../../utils/get-first-val.js'

enum PermissionLevel {
  admin = 'admin',
  editor = 'editor',
  authenticated = 'authenticated',
  anyone = 'anyone'
}

class Permissions {
  read: PermissionLevel
  write: PermissionLevel

  constructor (read?: PermissionLevel, write?: PermissionLevel) {
    const { DEFAULT_READ_PERMISSIONS, DEFAULT_WRITE_PERMISSIONS } = process.env
    this.read = getFirstVal(read, DEFAULT_READ_PERMISSIONS, 'anyone')
    this.write = getFirstVal(write, DEFAULT_WRITE_PERMISSIONS, 'anyone')
  }

  check (type: string, user?: User, revisions?: Revision[]): boolean {
    const level = type === 'write' ? this.write : this.read
    const history = revisions ?? []
    const editorIDs = history.map(rev => rev.editor.id)
    const isAnyone = level === PermissionLevel.anyone
    const isAuthenticated = level === PermissionLevel.authenticated && exists(user)
    const isEditor = level === PermissionLevel.editor && user?.id !== undefined && editorIDs.includes(user.id)
    return isAnyone || isAuthenticated || isEditor || user?.admin || false
  }

  canRead (user?: User, revisions?: Revision[]): boolean {
    return this.check('read', user, revisions)
  }
}

export default Permissions
export { PermissionLevel }
