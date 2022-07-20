class Email {
  addr?: string
  verified: boolean
  code?: string

  constructor (addr?: string, verified?: boolean, code?: string) {
    this.addr = addr
    this.verified = verified === true
    this.code = code
  }
}

export default Email
