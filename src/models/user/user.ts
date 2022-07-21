import Password from '../password/password.js'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import getValOrDefault from '../../utils/get-val-or-default.js'

interface UserConstructorOptions {
  active?: boolean
  admin?: boolean
  password?: string
}

class User {
  id?: string
  active: boolean
  admin: boolean
  password: Password
  emails: Email[]
  otp: OTP

  constructor (options?: UserConstructorOptions) {
    this.active = getValOrDefault(options?.active, true)
    this.admin = getValOrDefault(options?.admin, false)
    this.password = new Password(options?.password)
    this.emails = []
    this.otp = new OTP()
  }
}

export default User
