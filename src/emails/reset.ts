import PasswordReset from '../models/password-reset/password-reset.js'
import readFile from '../utils/read-file.js'
import renderStrVars from '../render/render-str-vars.js'
import sendMail from './send.js'

const sendReset = async (reset: PasswordReset, ipaddr: string, sender?: Function): Promise<boolean> => {
  const sendMailFn = sender ?? sendMail
  const { addr, verified } = reset.email
  if (!verified || addr === undefined) return false
  const text = renderStrVars(readFile('../../emails/reset.txt'), { resetcode: reset.code, ipaddr })
  return sendMailFn(addr, 'Reset your password', text)
}

export default sendReset
