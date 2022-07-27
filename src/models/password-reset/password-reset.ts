import cryptoRandomString from 'crypto-random-string'
import Email from '../email/email.js'
import User from '../user/user.js'
import PasswordResetModel from './model.js'
import loadUsersByEmail from '../user/loaders/by-email.js'
import getValOrDefault from '../../utils/get-val-or-default.js'

class PasswordReset {
  id?: string
  user: User
  email: Email
  code: string
  expiration: Date

  constructor (user: User, email: Email, code?: string, expiration?: Date) {
    if (expiration !== undefined) {
      this.expiration = expiration
    } else {
      const { PASSWDRESETEXPIRES } = process.env
      const now = new Date().getTime()
      this.expiration = new Date(now + parseInt(getValOrDefault(PASSWDRESETEXPIRES, 1800000)))
    }

    this.user = user
    this.email = email
    this.code = code ?? cryptoRandomString({ length: 32, type: 'distinguishable' })
  }

  async save (): Promise<void> {
    const user = this.user.id
    const { id, email, code, expiration } = this
    const data = { user, email, code, expiration }

    if (id === undefined) {
      const record = await PasswordResetModel.create(data)
      this.id = record._id?.toString()
    } else {
      await PasswordResetModel.findOneAndUpdate({ _id: id }, data)
    }
  }

  static async create (addr: string): Promise<PasswordReset[]> {
    const resets: PasswordReset[] = []
    const users = await loadUsersByEmail(addr)
    for (const user of users) {
      const emails = user.emails.filter(email => email.addr === addr)
      if (emails.length > 0) resets.push(new PasswordReset(user, emails[0]))
    }
    return resets
  }
}

export default PasswordReset
