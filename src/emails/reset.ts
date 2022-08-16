import PasswordReset from '../models/password-reset/password-reset.js'
import readFile from '../utils/read-file.js'
import renderStrVars from '../render/render-str-vars.js'
import getClient from './get-client.js'
import sendMail from './send.js'

const sendReset = async (reset: PasswordReset, ipaddr: string): Promise<boolean> => {
  const client = getClient()
  const { addr, verified } = reset.email
  if (!verified || addr === undefined) return false
  const text = renderStrVars(readFile('../../emails/reset.txt'), { resetcode: reset.code, ipaddr })
  return await sendMail(addr, 'Reset your password', text)
}

export default sendReset
