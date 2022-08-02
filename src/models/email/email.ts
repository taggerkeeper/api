import cryptoRandomString from 'crypto-random-string'
import EmailData from './data.js'
import exists from '../../utils/exists.js'

class Email {
  addr?: string
  verified: boolean
  code?: string

  constructor (data?: EmailData) {
    this.addr = data?.addr
    this.verified = data?.verified === true
    this.code = data?.code
  }

  generateVerificationCode (): string {
    this.code = cryptoRandomString({ length: 10 })
    return this.code
  }

  verify (code: string): boolean {
    if (!exists(this.addr)) return false
    if (code === this.code) this.verified = true
    return this.verified
  }

  getObj (): EmailData {
    const { addr, verified, code } = this
    return { addr, verified, code }
  }
}

export default Email
