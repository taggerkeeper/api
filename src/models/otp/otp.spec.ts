import { expect } from 'chai'
import speakeasy from 'speakeasy'
import validDataUrl from 'valid-data-url'
import OTP from './otp.js'
import { isOTPData } from './data.js'

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

    it('can be enabled', () => {
      const otp = new OTP({ enabled: true })
      expect(otp.enabled).to.equal(true)
    })

    it('can keep a secret', () => {
      const secret = 'shhhh'
      const otp = new OTP({ enabled: true, secret })
      expect(otp.secret).to.equal(secret)
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

    describe('getObj', () => {
      const otp = new OTP()

      it('returns an object', () => {
        expect(typeof otp.getObj()).to.equal('object')
      })

      it('returns a ContentData object', () => {
        expect(isOTPData(otp.getObj())).to.equal(true)
      })
    })

    describe('verify', () => {
      it('always returns true if OTP is not enabled', async () => {
        const otp = new OTP()
        const actual = await otp.verify(secret)
        expect(actual).to.equal(true)
      })

      it('returns true if given a valid token', async () => {
        const otp = new OTP()
        otp.enable(secret)
        const token = speakeasy.totp({ secret, encoding: 'base32' })
        const actual = await otp.verify(token)
        expect(actual).to.equal(true)
      })

      it('returns false if enabled but not given a valid token', async () => {
        const otp = new OTP()
        otp.enable(secret)
        const valid = speakeasy.totp({ secret, encoding: 'base32' })
        const invalid = valid === '111111' ? '222222' : '111111'
        const actual = await otp.verify(invalid)
        expect(actual).to.equal(false)
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

    describe('verify', () => {
      it('returns true when given a valid token', async () => {
        const { base32 } = await OTP.generate()
        const token = speakeasy.totp({ secret: base32, encoding: 'base32' })
        expect(OTP.verify(base32, token)).to.equal(true)
      })

      it('returns false when given an invalid token', async () => {
        const { base32 } = await OTP.generate()
        const valid = speakeasy.totp({ secret: base32, encoding: 'base32' })
        const token = valid === '111111' ? '222222' : '111111'
        expect(OTP.verify(base32, token)).to.equal(false)
      })
    })
  })
})
