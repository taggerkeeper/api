import PasswordReset from '../models/password-reset/password-reset.js'
import composeMail from './compose.js'
import getClient from './get-client.js'
import sendMail from './send.js'

const sendReset = async (reset: PasswordReset, ipaddr: string): Promise<boolean> => {
  const client = getClient()
  const { addr, code, verified } = reset.email
  if (!verified || addr === undefined) return false
  const validation = await client.validate.get(addr)
  if (!validation) return false
  const text = await composeMail('../../emails/reset.txt', { resetcode: reset.code, ipaddr })
  return await sendMail(addr, 'Reset your password', text)
}

export default sendReset
