import checkAll from '../../utils/check-all.js'
import exists from '../../utils/exists.js'

interface PublicFileData {
  location: string
  key: string
  mime: string
  size: {
    bytes: number
    str: string
  }
}

const isPublicFileData = (obj: any): obj is PublicFileData => {
  if (!exists(obj)) return false
  const { location, key, mime, size } = obj
  return checkAll([
    checkAll([typeof obj === 'object', !Array.isArray(obj)]),
    checkAll([location !== undefined, typeof location === 'string']),
    checkAll([key !== undefined, typeof key === 'string']),
    checkAll([mime !== undefined, typeof mime === 'string']),
    checkAll([size !== undefined, typeof size === 'object']),
    checkAll([size?.bytes !== undefined, typeof size?.bytes === 'number', !isNaN(size?.bytes)]),
    checkAll([size?.str !== undefined, typeof size?.str === 'string'])
  ])
}

export default PublicFileData
export { isPublicFileData }
