import readFile from '../utils/read-file.js'
import renderStrVars from '../render/render-str-vars.js'
import getClient from './get-client.js'
import sendMail from './send.js'

const sendResetFail = async (addr: string, ipaddr: string, sender?: Function): Promise<boolean> => {
  const sendMailFn = sender ?? sendMail
  const client = getClient()
  const text = renderStrVars(readFile('../../emails/reset-fail.txt'), { emailaddr: addr, ipaddr })
  return await sendMailFn(addr, 'Password reset failed', text)
}

export default sendResetFail
