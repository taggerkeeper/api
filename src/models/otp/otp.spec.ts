import { expect } from 'chai'
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
