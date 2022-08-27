import User from '../user.js'
import UserData from '../data.js'
import Email from '../../email/email.js'
import getId from '../../../utils/get-id.js'

const loadUserFromRecord = (record: UserData | null): User | null => {
  if (record === null) return null
  const { name, active, admin, password, emails, otp } = record
  const user = new User({ name, active, admin })

  const id = getId(record)
  if (id !== null) user.id = id

  if (password !== undefined) user.password.hash = password
  user.emails = emails === undefined ? [] : emails.map(data => new Email(data))

  if (otp !== undefined) {
    user.otp.enabled = otp.enabled
    user.otp.secret = otp.secret
  }

  return user
}

export default loadUserFromRecord
