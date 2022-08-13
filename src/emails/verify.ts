import path from 'path'
import Email from '../models/email/email.js'
import composeMail from './compose.js'
import getClient from './get-client.js'
import sendMail from './send.js'

const sendVerification = async (email: Email, ipaddr: string): Promise<boolean> => {
  const client = getClient()
  const { addr, code, verified } = email
  if (verified || addr === undefined) return false
  const validation = await client.validate.get(addr)
  if (!validation) return false
  const text = await composeMail('../../emails/verify.txt', { emailaddr: addr, verifycode: code, ipaddr })
  return await sendMail(addr as string, 'Can you verify this email address?', text)
}

export default sendVerification
