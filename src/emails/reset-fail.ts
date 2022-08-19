import readFile from '../utils/read-file.js'
import renderStrVars from '../render/render-str-vars.js'
import sendMail from './send.js'

const sendResetFail = async (addr: string, ipaddr: string, sender?: Function): Promise<boolean> => {
  const sendMailFn = sender ?? sendMail
  const text = renderStrVars(readFile('../../emails/reset-fail.txt'), { emailaddr: addr, ipaddr })
  return sendMailFn(addr, 'Password reset failed', text)
}

export default sendResetFail
