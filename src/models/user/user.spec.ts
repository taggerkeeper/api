import { expect } from 'chai'
import Password from '../password/password.js'
import User from './user.js'

describe('User', () => {
  describe('constructor', () => {
    it('returns a User instance', () => {
      const user = new User()
      expect(user).to.be.instanceOf(User)
    })

    it('sets active to true by default', () => {
      const user = new User()
      expect(user.active).to.equal(true)
    })

    it('lets you set the active flag', () => {
      const user = new User({ active: false })
      expect(user.active).to.equal(false)
    })

    it('sets admin to false by default', () => {
      const user = new User()
      expect(user.admin).to.equal(false)
    })

    it('lets you set the admin flag', () => {
      const user = new User({ admin: true })
      expect(user.admin).to.equal(true)
    })

    it('sets a random password by default', () => {
      const user = new User()
      expect(user.password).to.be.instanceOf(Password)
    })

    it('lets you set the password', () => {
      const password = 'password'
      const user = new User({ password })
      expect(user.password.verify(password)).to.equal(true)
    })

    it('creates an empty array for emails by default', () => {
      const user = new User()
      expect(JSON.stringify(user.emails)).to.equal('[]')
    })

    it('sets OTP to not enabled by default', () => {
      const user = new User()
      expect(user.otp.enabled).to.equal(false)
    })

    it('sets OTP secret to undefined by default', () => {
      const user = new User()
      expect(user.otp.secret).to.equal(undefined)
    })
  })
})
