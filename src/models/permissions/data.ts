import checkAll from '../../utils/check-all.js'

enum PermissionLevel {
  admin = 'admin',
  editor = 'editor',
  authenticated = 'authenticated',
  anyone = 'anyone'
}

interface PermissionsData {
  read: PermissionLevel
  write: PermissionLevel
}

const isPermissionsData = (obj: any): obj is PermissionsData => {
  const values = Object.values(PermissionLevel)
  return checkAll([
    values.includes(obj?.read),
    values.includes(obj?.write)
  ])
}

export default PermissionsData
export { PermissionLevel, isPermissionsData }
