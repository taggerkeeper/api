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
      const email = new Email({ addr })
      expect(email.addr).to.equal(addr)
    })

    it('sets the email as unverified by default', () => {
      const email = new Email()
      expect(email.verified).to.equal(false)
    })

    it('lets you specify if the email is verified', () => {
      const email = new Email({ addr: 'tester@testing.com', verified: true })
      expect(email.verified).to.equal(true)
    })

    it('doesn\'t set a verification code by default', () => {
      const email = new Email()
      expect(email.code).to.equal(undefined)
    })

    it('lets you set a verification code', () => {
      const code = '123abc'
      const email = new Email({ addr: 'tester@testing.com', verified: true, code })
      expect(email.code).to.equal(code)
    })
  })

  describe('Instance methods', () => {
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

    describe('verify', () => {
      it('returns false if the code is wrong', () => {
        const email = new Email({ addr: 'tester@testing.com' })
        email.generateVerificationCode()
        const res = email.verify('lolnope')
        expect(res).to.equal(false)
      })

      it('doesn\'t verify the email if the code is wrong', () => {
        const email = new Email({ addr: 'tester@testing.com' })
        email.generateVerificationCode()
        email.verify('lolnope')
        expect(email.verified).to.equal(false)
      })

      it('doesn\'t verify the email if it has no address', () => {
        const email = new Email()
        const code = email.generateVerificationCode()
        email.verify(code)
        expect(email.verified).to.equal(false)
      })

      it('doesn\'t verify the email if the address is a null string', () => {
        const email = new Email({ addr: '' })
        const code = email.generateVerificationCode()
        email.verify(code)
        expect(email.verified).to.equal(false)
      })

      it('returns true if the code is correct', () => {
        const email = new Email({ addr: 'tester@testing.com' })
        const code = email.generateVerificationCode()
        const res = email.verify(code)
        expect(res).to.equal(true)
      })

      it('verifies the email if the code is correct', () => {
        const email = new Email({ addr: 'tester@testing.com' })
        const code = email.generateVerificationCode()
        email.verify(code)
        expect(email.verified).to.equal(true)
      })

      it('returns true if you supply an incorrect code to an already-verified email', () => {
        const email = new Email({ addr: 'tester@testing.com', verified: true })
        email.generateVerificationCode()
        const res = email.verify('lolnope')
        expect(res).to.equal(true)
      })

      it('returns true if you supply the correct code to an already-verified email', () => {
        const email = new Email({ addr: 'tester@testing.com', verified: true })
        const code = email.generateVerificationCode()
        const res = email.verify(code)
        expect(res).to.equal(true)
      })
    })
  })
})
