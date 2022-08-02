import User from '../user.js'
import UserModel from '../model.js'
import loadUserFromRecord from './from-record.js'

const loadUsersByEmail = async (addr: string): Promise<User[]> => {
  const records = await UserModel.find({ 'emails.addr': addr })
  const users = []
  for (const record of records) {
    const allEmails = record.emails === undefined ? [] : record.emails
    const verifiedEmails = allEmails.filter(email => email.addr === addr && email.verified)
    const user = verifiedEmails.length > 0 ? loadUserFromRecord(record) : null
    if (user !== null) users.push(user)
  }
  return users
}

export default loadUsersByEmail
