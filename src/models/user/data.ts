import EmailData, { isEmailData } from '../email/data.js'
import OTPData, { isOTPData } from '../otp/data.js'
import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface UserData {
  _id?: string | object
  id?: string
  name: string
  active?: boolean
  admin?: boolean
  password?: string
  refresh?: string
  emails?: EmailData[]
  otp?: OTPData
}

const isUserData = (obj: any): obj is UserData => {
  if (!exists(obj) || typeof obj !== 'object' || Array.isArray(obj)) return false
  const { _id, id, name, active, admin, password, refresh, emails, otp } = obj
  const e = emails === undefined || !Array.isArray(emails)
    ? [false]
    : emails.map((data: any) => isEmailData(data))
  return checkAll([
    checkAny([!exists(_id), typeof _id === 'string', typeof _id === 'object']),
    checkAny([!exists(id), typeof id === 'string']),
    typeof name === 'string',
    checkAny([!exists(active), active === true, active === false]),
    checkAny([!exists(admin), admin === true, admin === false]),
    checkAny([!exists(password), typeof password === 'string']),
    checkAny([!exists(refresh), typeof refresh === 'string']),
    checkAny([!exists(emails), checkAll(e)]),
    checkAny([!exists(otp), isOTPData(otp)])
  ])
}

export default UserData
export { isUserData }
