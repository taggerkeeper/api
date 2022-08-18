import getEnvVar from '../utils/get-env-var.js'
import getClient from './get-client.js'

const sendMail = async (emailTo: string, subject: string, text: string, fns?: { emailer: Function, validator: Function }): Promise<boolean> => {
  const domain = getEnvVar('MAILGUN_DOMAIN') as string
  const emailFrom = getEnvVar('EMAIL_FROM') as string

  try {
    const client = fns === undefined ? getClient() : null
    const emailer = fns?.emailer ?? client.messages.create
    const validator = fns?.validator ?? client.validate.get

    const validation = await validator(emailTo)
    if (validation.is_valid === true) {
      await emailer(domain, {
        from: emailFrom,
        to: emailTo,
        subject,
        text
      })
      return true
    } else {
      return false
    }
  } catch (err) {
    console.error(err)
    return false
  }
}

export default sendMail
