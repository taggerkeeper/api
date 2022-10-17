import checkAll from '../../utils/check-all.js'
import exists from '../../utils/exists.js'

interface FileData {
  location: string
  key: string
  mime: string
  size: number
}

const isFileData = (obj: any): obj is FileData => {
  if (!exists(obj)) return false
  const { location, key, mime, size } = obj
  return checkAll([
    typeof obj === 'object',
    !Array.isArray(obj),
    typeof location === 'string',
    typeof key === 'string',
    typeof mime === 'string',
    typeof size === 'number',
    !isNaN(size)
  ])
}

export default FileData
export { isFileData }
