import UserData, { isUserData } from '../user/data.js'
import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface SessionData {
  _id?: string | object
  user: UserData | UserData['_id']
}

const isSessionData = (obj: any): obj is SessionData => {
  if (!exists(obj) || typeof obj !== 'object') return false
  return checkAll([
    checkAny([!exists(obj._id), typeof obj._id === 'object', typeof obj._id === 'string']),
    checkAny([!exists(obj._id), !Array.isArray(obj._id)]),
    exists(obj.user),
    checkAny([typeof obj.user === 'object', typeof obj.user === 'string', isUserData(obj.user)]),
    !Array.isArray(obj.user)
  ])
}

export default SessionData
export { isSessionData }
