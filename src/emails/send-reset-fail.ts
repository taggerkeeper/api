import composeMail from './compose.js'
import getClient from './get-client.js'
import sendMail from './send.js'

const sendResetFail = async (addr: string, ipaddr: string): Promise<boolean> => {
  const client = getClient()
  const validation = await client.validate.get(addr)
  if (!validation) return false
  const text = await composeMail('../../emails/reset-fail.txt', { emailaddr: addr, ipaddr })
  return await sendMail(addr, 'Password reset failed', text)
}

export default sendResetFail
