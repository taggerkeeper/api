import User from '../user.js'
import UserData from '../data.js'
import Email from '../../email/email.js'

const loadUserFromRecord = (record: UserData | null): User | null => {
  if (record === null) return null
  const { _id, active, admin, password, otp } = record
  const user = new User({ active, admin })

  user.id = _id?.toString()

  if (password !== undefined) user.password.hash = password
  user.emails = record.emails.map(data => new Email(data))

  if (otp !== undefined) {
    user.otp.enabled = otp.enabled
    user.otp.secret = otp.secret
  }

  return user
}

export default loadUserFromRecord
