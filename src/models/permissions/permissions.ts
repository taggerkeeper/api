import getFirstVal from '../../utils/get-first-val.js'

class Permissions {
  read: string
  write: string

  constructor (read?: string, write?: string) {
    const { DEFAULT_READ_PERMISSIONS, DEFAULT_WRITE_PERMISSIONS } = process.env
    this.read = getFirstVal(read, DEFAULT_READ_PERMISSIONS, '777')
    this.write = getFirstVal(write, DEFAULT_WRITE_PERMISSIONS, '777')
  }
}

export default Permissions
