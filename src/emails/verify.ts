import Email from '../models/email/email.js'
import readFile from '../utils/read-file.js'
import renderStrVars from '../render/render-str-vars.js'
import getClient from './get-client.js'
import sendMail from './send.js'

const sendVerification = async (email: Email, ipaddr: string): Promise<boolean> => {
  const client = getClient()
  const { addr, code, verified } = email
  if (verified || addr === undefined) return false
  const validation = await client.validate.get(addr)
  if (validation.is_valid === false) return false
  const text = renderStrVars(readFile('../../emails/verify.txt'), { emailaddr: addr, verifycode: code, ipaddr })
  return await sendMail(addr, 'Can you verify this email address?', text)
}

export default sendVerification
