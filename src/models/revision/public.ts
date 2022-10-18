import ContentData, { isContentData } from '../content/data.js'
import FileData, { isFileData } from '../file/data.js'
import PermissionsData, { isPermissionsData } from '../permissions/data.js'
import PublicUserData, { isPublicUserData } from '../user/public.js'
import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface PublicRevisionData {
  content: ContentData
  file?: FileData
  thumbnail?: FileData
  permissions?: PermissionsData
  editor?: PublicUserData | PublicUserData['id']
  msg?: string
  timestamp?: Date
}

const isPublicRevisionData = (obj: any): obj is PublicRevisionData => {
  if (!exists(obj) || typeof obj !== 'object') return false
  const { content, file, thumbnail, permissions, editor, msg, timestamp } = obj
  return checkAll([
    checkAll([exists(content), isContentData(content)]),
    checkAny([!exists(file), isFileData(file)]),
    checkAny([!exists(thumbnail), isFileData(thumbnail)]),
    checkAny([!exists(permissions), isPermissionsData(permissions)]),
    checkAny([!exists(editor), isPublicUserData(editor), typeof editor === 'string', typeof editor === 'object']),
    checkAny([!exists(msg), typeof msg === 'string']),
    checkAny([!exists(timestamp), timestamp?.constructor?.name === 'Date'])
  ])
}

export default PublicRevisionData
export { isPublicRevisionData }
