import getEnvVar from '../utils/get-env-var.js'
import getClient from './get-client.js'

const sendMail = async (emailTo: string, subject: string, text: string, client?: { messages: { create: Function }, validate: { get: Function } }): Promise<boolean> => {
  const domain = getEnvVar('MAILGUN_DOMAIN') as string
  const emailFrom = getEnvVar('EMAIL_FROM') as string

  try {
    const mailgun = client ?? getClient()
    const validation = await mailgun.validate.get(emailTo)
    if (validation.is_valid === true) {
      await mailgun.messages.create(domain, {
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
