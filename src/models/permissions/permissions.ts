import User from '../user/user.js'
import Revision from '../revision/revision.js'
import PermissionsData, { PermissionLevel } from './data.js'
import exists from '../../utils/exists.js'
import getFirstVal from '../../utils/get-first-val.js'

class Permissions {
  read: PermissionLevel
  write: PermissionLevel

  constructor (options?: PermissionsData) {
    const { DEFAULT_READ_PERMISSIONS, DEFAULT_WRITE_PERMISSIONS } = process.env
    this.read = getFirstVal(options?.read, DEFAULT_READ_PERMISSIONS, 'anyone')
    this.write = getFirstVal(options?.write, DEFAULT_WRITE_PERMISSIONS, 'anyone')
  }

  check (type: string, user?: User, revisions?: Revision[]): boolean {
    const level = type === 'write' ? this.write : this.read
    const history = revisions ?? []
    const editorIDs = history.map(rev => rev.editor?.id)
    const isAnyone = level === PermissionLevel.anyone
    const isAuthenticated = level === PermissionLevel.authenticated && exists(user)
    const isEditor = level === PermissionLevel.editor && user?.id !== undefined && editorIDs.includes(user.id)
    return isAnyone || isAuthenticated || isEditor || user?.admin === true || false
  }

  canRead (user?: User, revisions?: Revision[]): boolean {
    return this.check('read', user, revisions)
  }

  canWrite (user?: User, revisions?: Revision[]): boolean {
    return this.check('write', user, revisions)
  }

  getObj (): PermissionsData {
    return {
      read: this.read,
      write: this.write
    }
  }
}

export default Permissions
