import { expect } from 'chai'
import OTP from './otp.js'

describe('OTP', () => {
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
})
