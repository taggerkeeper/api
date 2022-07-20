import { expect } from 'chai'
import Password from './password.js'

describe('Password', () => {
  describe('constructor', () => {
    it('creates a password', () => {
      const plaintext = 'password'
      const pwd = new Password(plaintext)
      expect(pwd.hash).to.equal(plaintext)
    })
  })
})
