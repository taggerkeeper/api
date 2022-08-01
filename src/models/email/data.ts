import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface EmailData {
  addr?: string
  verified?: boolean
  code?: string
}

const isEmailData = (obj: any): obj is EmailData => {
  const { addr, verified, code } = obj
  return checkAll([
    checkAny([!exists(addr), typeof addr === 'string']),
    checkAny([!exists(verified), verified === true, verified === false]),
    checkAny([!exists(code), typeof code === 'string'])
  ])
}

export default EmailData
export { isEmailData }
