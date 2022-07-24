import { expect } from 'chai'
import Email from '../email/email.js'
import User from '../user/user.js'
import PasswordReset from './password-reset.js'

describe('PasswordReset', () => {
  describe('constructor', () => {
    it('assigns the user given', () => {
      const user = new User()
      const email = new Email()
      const reset = new PasswordReset(user, email)
      expect(reset.user).to.equal(user)
    })

    it('assigns the email given', () => {
      const user = new User()
      const email = new Email('test@testing.com', true)
      const reset = new PasswordReset(user, email)
      expect(reset.email).to.equal(email)
    })

    it('creates a random 32-character code', () => {
      const user = new User()
      const email = new Email('test@testing.com', true)
      const reset = new PasswordReset(user, email)
      expect(reset.code).to.have.lengthOf(32)
    })

    it('expires in 30 minutes by default', () => {
      const before = new Date()
      before.setTime(before.getTime() + 1920000)
      const user = new User()
      const email = new Email('test@testing.com', true)
      const reset = new PasswordReset(user, email)
      expect(reset.expiration).to.be.below(before)
    })
  })
})
