import getEnvVar from '../utils/get-env-var.js'
import getClient from './get-client.js'

const sendMail = async (emailTo: string, subject: string, text: string): Promise<boolean> => {
  const domain = getEnvVar('MAILGUN_DOMAIN') as string
  const emailFrom = getEnvVar('EMAIL_FROM') as string

  try {
    const client = getClient()
    const validation = await client.validate.get(emailTo)
    if (validation.is_valid === true) {
      await client.messages.create(domain, {
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
