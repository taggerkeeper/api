import cryptoRandomString from 'crypto-random-string'
import Email from '../email/email.js'
import User from '../user/user.js'
import getValOrDefault from '../../utils/get-val-or-default.js'

class PasswordReset {
  user: User
  email: Email
  code: string
  expiration: Date

  constructor (user: User, email: Email) {
    const { PASSWDRESETEXPIRES } = process.env
    const now = new Date().getTime()
    this.expiration = new Date(now + getValOrDefault(PASSWDRESETEXPIRES, 1800000))

    this.user = user
    this.email = email
    this.code = cryptoRandomString({ length: 32, type: 'distinguishable' })
  }
}

export default PasswordReset
