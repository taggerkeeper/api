import ContentData, { isContentData } from '../content/data.js'
import PermissionsData, { isPermissionsData } from '../permissions/data.js'
import UserData, { isUserData } from '../user/data.js'
import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface RevisionData {
  content: ContentData
  permissions?: PermissionsData
  editor?: UserData
  msg?: string
  timestamp?: Date
}

const isRevisionData = (obj: any): obj is RevisionData => {
  if (!exists(obj) || typeof obj !== 'object') return false
  const { content, permissions, editor, msg, timestamp } = obj
  return checkAll([
    checkAll([exists(content), isContentData(content)]),
    checkAny([!exists(permissions), isPermissionsData(permissions)]),
    checkAny([!exists(editor), isUserData(editor)]),
    checkAny([!exists(msg), typeof msg === 'string']),
    checkAny([!exists(timestamp), timestamp?.constructor?.name === 'Date'])
  ])
}

export default RevisionData
export { isRevisionData }
