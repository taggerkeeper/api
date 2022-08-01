import cryptoRandomString from 'crypto-random-string'
import Email from '../email/email.js'
import User from '../user/user.js'
import { IUser } from '../user/model.js'
import PasswordResetModel, { IPasswordReset } from './model.js'
import loadUsersByEmail from '../user/loaders/by-email.js'
import getFirstVal from '../../utils/get-first-val.js'

class PasswordReset {
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
      this.expiration = new Date(now + parseInt(getFirstVal(PASSWDRESETEXPIRES, 1800000)))
    }

    this.user = user
    this.email = email
    this.code = code ?? cryptoRandomString({ length: 32, type: 'distinguishable' })
  }

  async use (newPasswd: string): Promise<void> {
    const { user, email } = this
    user.password.change(newPasswd)
    await user.save()
    await PasswordResetModel.deleteMany({ 'email.addr': email.addr })
  }

  async save (): Promise<void> {
    const user = this.user.id
    const { email, code, expiration } = this
    const data = { user, email, code, expiration }
    await PasswordResetModel.deleteMany({ 'email.addr': email.addr })
    await PasswordResetModel.create(data)
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

  static loadObject (record: IPasswordReset): PasswordReset {
    if (typeof record.user === 'string') throw new Error('PasswordReset.loadObject can only load password reset records on which the user has been populated.')
    const user = User.loadObject(record.user as IUser)
    const email = new Email(record.email)
    return new PasswordReset(user, email, record.code, record.expiration)
  }
}

export default PasswordReset
