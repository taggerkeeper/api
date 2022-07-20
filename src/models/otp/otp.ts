class OTP {
  enabled: boolean = false
  secret?: string = undefined

  enable (secret: string): boolean {
    this.secret = secret
    this.enabled = true
    return this.enabled
  }
}

export default OTP
