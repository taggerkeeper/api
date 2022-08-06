import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface PublicUserData {
  id: string
  active: boolean
  admin: boolean
}

const isPublicUserData = (obj: any): obj is PublicUserData => {
  if (!exists(obj) || typeof obj !== 'object' || Array.isArray(obj)) return false
  const { id, active, admin } = obj
  return checkAll([
    typeof id === 'string',
    checkAny([active === true, active === false]),
    checkAny([admin === true, admin === false]),
    obj._id === undefined,
    obj.password === undefined,
    obj.emails === undefined,
    obj.otp === undefined
  ])
}

export default PublicUserData
export { isPublicUserData }
