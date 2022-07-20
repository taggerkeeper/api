import cryptoRandomString from 'crypto-random-string'

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
}

export default Email
