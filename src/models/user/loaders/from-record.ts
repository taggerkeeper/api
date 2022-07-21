import User from '../user.js'
import { IUser } from '../model.js'
import Email from '../../email/email.js'

const loadUserFromRecord = (record: IUser | null): User | null => {
  if (record === null) return null
  const { _id, active, admin, password, otp } = record
  const user = new User({ active, admin })

  user.id = _id?.toString()

  if (password !== undefined) user.password.hash = password

  for (const email of record.emails) {
    const e = new Email(email.addr, email.verified, email.code)
    user.emails.push(e)
  }

  if (otp !== undefined) {
    user.otp.enabled = otp.enabled
    user.otp.secret = otp.secret
  }

  return user
}

export default loadUserFromRecord
