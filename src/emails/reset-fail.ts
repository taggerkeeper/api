import readFile from '../utils/read-file.js'
import renderStrVars from '../render/render-str-vars.js'
import getClient from './get-client.js'
import sendMail from './send.js'

const sendResetFail = async (addr: string, ipaddr: string): Promise<boolean> => {
  const client = getClient()
  const text = renderStrVars(readFile('../../emails/reset-fail.txt'), { emailaddr: addr, ipaddr })
  return await sendMail(addr, 'Password reset failed', text)
}

export default sendResetFail
