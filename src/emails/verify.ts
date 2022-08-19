import Email from '../models/email/email.js'
import readFile from '../utils/read-file.js'
import renderStrVars from '../render/render-str-vars.js'
import getClient from './get-client.js'
import sendMail from './send.js'

const sendVerification = async (email: Email, ipaddr: string, sender?: Function): Promise<boolean> => {
  const sendMailFn = sender ?? sendMail
  const client = getClient()
  const { addr, code, verified } = email
  if (verified || addr === undefined) return false
  const text = renderStrVars(readFile('../../emails/verify.txt'), { emailaddr: addr, verifycode: code, ipaddr })
  return await sendMailFn(addr, 'Can you verify this email address?', text)
}

export default sendVerification
