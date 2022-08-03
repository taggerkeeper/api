import cryptoRandomString from 'crypto-random-string'
import Email from '../email/email.js'
import User from '../user/user.js'
import { isUserData } from '../user/data.js'
import PasswordResetData from './data.js'
import PasswordResetModel from './model.js'
import loadUsersByEmail from '../user/loaders/by-email.js'
import getFirstVal from '../../utils/get-first-val.js'

class PasswordReset {
  user: User
  email: Email
  code: string
  expiration: Date

  constructor (data: PasswordResetData) {
    const { user, email, code, expiration } = data
    if (expiration !== undefined) {
      this.expiration = expiration
    } else {
      const { PASSWDRESETEXPIRES } = process.env
      const now = new Date().getTime()
      this.expiration = new Date(now + parseInt(getFirstVal(PASSWDRESETEXPIRES, 1800000)))
    }

    this.user = isUserData(user) ? new User(user) : new User()
    this.email = new Email(email)
    this.code = code ?? cryptoRandomString({ length: 32, type: 'distinguishable' })
  }

  getObj (): PasswordResetData {
    return {
      user: this.user.getObj(),
      email: this.email.getObj(),
      code: this.code,
      expiration: this.expiration
    }
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
      if (emails.length > 0) resets.push(new PasswordReset({ user, email: emails[0] }))
    }
    return resets
  }
}

export default PasswordReset
