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

  describe('Static methods', () => {
    describe('encrypt', () => {
      it('hashes the password', () => {
        const plaintext = 'password'
        const hash = Password.encrypt(plaintext)
        expect(hash).not.to.equal(plaintext)
      })

      it('long passwords work', () => {
        const preface = 'bcrypt will only hash the first 72 bytes of a string. This preface is 79 bytes.'
        const h1 = Password.encrypt(`${preface} This will be our first test password.`)
        const h2 = Password.encrypt(`${preface} This will be the second password that we test.`)
        expect(h1).not.to.equal(h2)
      })
    })
  })
})
