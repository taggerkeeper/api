import formData from 'form-data'
import Mailgun from 'mailgun.js'
import getEnvVar from '../utils/get-env-var.js'

const sendMail = async (emailTo: string, subject: string, text: string): Promise<boolean> => {
  const username = getEnvVar('MAILGUN_USERNAME') as string
  const key = getEnvVar('MAILGUN_APIKEY') as string
  const url = getEnvVar('MAILGUN_API') as string
  const domain = getEnvVar('MAILGUN_DOMAIN') as string
  const emailFrom = getEnvVar('EMAIL_FROM') as string

  const mailgun = new Mailgun(formData)
  const client = mailgun.client({ username, key, url })

  try {
    await client.messages.create(domain, {
      from: emailFrom,
      to: emailTo,
      subject,
      text
    })
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

export default sendMail
