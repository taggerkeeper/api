import cryptoRandomString from 'crypto-random-string'
import exists from '../../utils/exists.js'

class Email {
  addr?: string
  verified: boolean
  code?: string

  constructor (addr?: string, verified?: boolean, code?: string) {
    this.addr = addr
    this.verified = verified === true
    this.code = code
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
}

export default Email
