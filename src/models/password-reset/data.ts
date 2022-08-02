import UserData, { isUserData } from '../user/data.js'
import EmailData, { isEmailData } from '../email/data.js'
import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface PasswordResetData {
  _id?: string | object
  user: UserData['_id'] | UserData
  email: EmailData
  code?: string
  expiration?: Date
}

const isPasswordResetData = (obj: any): obj is PasswordResetData => {
  if (typeof obj !== 'object') return false
  const { _id, user, email, code, expiration } = obj
  return checkAll([
    checkAny([!exists(_id), typeof _id === 'string', typeof _id === 'object']),
    checkAny([typeof user === 'string', isUserData(user)]),
    isEmailData(email),
    checkAny([!exists(code), typeof code === 'string']),
    checkAny([!exists(expiration), expiration?.constructor?.name === 'Date'])
  ])
}

export default PasswordResetData
export { isPasswordResetData }
