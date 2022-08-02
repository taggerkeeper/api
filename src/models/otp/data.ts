import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface OTPData {
  enabled: boolean
  secret?: string
}

const isOTPData = (obj: any): obj is OTPData => {
  if (!exists(obj) || typeof obj !== 'object') return false
  const { enabled, secret } = obj
  return checkAll([
    checkAny([enabled === true, enabled === false]),
    checkAny([!exists(secret), typeof secret === 'string'])
  ])
}

export default OTPData
export { isOTPData }
