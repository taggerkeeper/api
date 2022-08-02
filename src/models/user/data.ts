import EmailData, { isEmailData } from '../email/data.js'
import OTPData, { isOTPData } from '../otp/data.js'
import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface UserData {
  _id?: string | object
  id?: string
  active: boolean
  admin: boolean
  password?: string
  emails: EmailData[]
  otp: OTPData
}

const isUserData = (obj: any): obj is UserData => {
  const { _id, id, active, admin, password, emails, otp } = obj
  if (!Array.isArray(emails)) return false
  return checkAll([
    checkAny([!exists(_id), typeof _id === 'string', typeof _id === 'object']),
    checkAny([!exists(id), typeof id === 'string']),
    checkAny([active === true, active === false]),
    checkAny([admin === true, admin === false]),
    checkAny([!exists(password), typeof password === 'string']),
    ...emails.map((data: any) => isEmailData(data)),
    isOTPData(otp)
  ])
}

export default UserData
export { isUserData }
