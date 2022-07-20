import { expect } from 'chai'
import validDataUrl from 'valid-data-url'
import OTP from './otp.js'

describe('OTP', () => {
  const secret = 'shhhhh'

  describe('constructor', () => {
    it('is not enabled by default', () => {
      const otp = new OTP()
      expect(otp.enabled).to.equal(false)
    })

    it('has no secret by default', () => {
      const otp = new OTP()
      expect(otp.secret).to.equal(undefined)
    })
  })

  describe('Instance methods', () => {
    describe('enable', () => {
      it('sets the secret', () => {
        const otp = new OTP()
        otp.enable(secret)
        expect(otp.secret).to.equal(secret)
      })

      it('sets that the OTP is enabled', () => {
        const otp = new OTP()
        otp.enable('shhhhh')
        expect(otp.enabled).to.equal(true)
      })

      it('returns true', () => {
        const otp = new OTP()
        const val = otp.enable(secret)
        expect(val).to.equal(true)
      })
    })
  })

  describe('Static methods', () => {
    describe('generate', () => {
      it('returns the secret in ASCII plain text', async () => {
        const { ascii } = await OTP.generate()
        expect(ascii).not.to.equal(undefined)
      })

      it('returns the secret in hexadecimal', async () => {
        const { hex } = await OTP.generate()
        expect(hex).not.to.equal(undefined)
      })

      it('returns the secret in base32', async () => {
        const { base32 } = await OTP.generate()
        expect(base32).not.to.equal(undefined)
      })

      it('returns the secret in a handy URL format', async () => {
        const secret = await OTP.generate()
        expect(secret.otpauth_url).not.to.equal(undefined)
      })

      it('returns a data URL for the QR code', async () => {
        const { qr } = await OTP.generate()
        expect(validDataUrl(qr)).to.equal(true)
      })
    })
  })
})
