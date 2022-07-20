import { expect } from 'chai'
import Email from './email.js'

describe('Email', () => {
  describe('constructor', () => {
    it('leaves the address undefined by default', () => {
      const email = new Email()
      expect(email.addr).to.equal(undefined)
    })

    it('lets you set the address', () => {
      const addr = 'tester@testing.com'
      const email = new Email(addr)
      expect(email.addr).to.equal(addr)
    })

    it('sets the email as unverified by default', () => {
      const email = new Email()
      expect(email.verified).to.equal(false)
    })

    it('lets you specify if the email is verified', () => {
      const email = new Email('tester@testing.com', true)
      expect(email.verified).to.equal(true)
    })

    it('doesn\'t set a verification code by default', () => {
      const email = new Email()
      expect(email.code).to.equal(undefined)
    })

    it('lets you set a verification code', () => {
      const code = '123abc'
      const email = new Email('tester@testing.com', true, code)
      expect(email.code).to.equal(code)
    })
  })

  describe('generateVerificationCode', () => {
    it('returns a string', () => {
      const email = new Email()
      const code = email.generateVerificationCode()
      expect(typeof code).to.equal('string')
    })

    it('returns a 10-character string', () => {
      const email = new Email()
      const code = email.generateVerificationCode()
      expect(code).to.have.lengthOf(10)
    })

    it('saves the code', () => {
      const email = new Email()
      const code = email.generateVerificationCode()
      expect(code).to.equal(email.code)
    })
  })
})
