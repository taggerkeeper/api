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
}

export default Permissions
export { PermissionLevel }
