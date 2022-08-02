import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import OTPData from './data.js'

interface OTPSecret {
  ascii: string
  hex: string
  base32: string
  otpauth_url?: string
  qr: string
}

class OTP {
  enabled: boolean = false
  secret?: string = undefined

  constructor (data?: OTPData) {
    this.enabled = data?.enabled ?? false
    if (data?.secret !== undefined) this.secret = data.secret
  }

  enable (secret: string): boolean {
    this.secret = secret
    this.enabled = true
    return this.enabled
  }

  async verify (token: string): Promise<boolean> {
    if (!this.enabled) return true
    return OTP.verify(this.secret as string, token)
  }

  static async generate (): Promise<OTPSecret> {
    const secret = speakeasy.generateSecret()
    const qr = secret?.otpauth_url !== undefined ? await QRCode.toDataURL(secret.otpauth_url) : ''
    return Object.assign({}, secret, { qr })
  }

  static verify (secret: string, token: string): boolean {
    return speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 2 })
  }
}

export default OTP
