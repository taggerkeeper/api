import formData from 'form-data'
import Mailgun from 'mailgun.js'
import getEnvVar from '../utils/get-env-var.js'

const getClient = () => {
  const username = getEnvVar('MAILGUN_USERNAME') as string
  const key = getEnvVar('MAILGUN_APIKEY') as string
  const url = getEnvVar('MAILGUN_API') as string

  const mailgun = new Mailgun(formData)
  return mailgun.client({ username, key, url })
}

export default getClient
