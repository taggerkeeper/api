import { expect } from 'chai'
import Password from './password.js'

describe('Password', () => {
  describe('constructor', () => {
    it('hashes the password', () => {
      const plaintext = 'password'
      const pwd = new Password(plaintext)
      expect(pwd.hash).not.to.equal(plaintext)
    })

    it('generates a random password if you don\'t provide one', () => {
      const pwd = new Password()
      expect(pwd.hash).not.to.equal(undefined)
    })
  })

  describe('Instance methods', () => {
    describe('change', () => {
      it('changes the password', () => {
        const pwd = new Password('password')
        const before = pwd.hash
        pwd.change('new password')
        expect(before).not.to.equal(pwd.hash)
      })

      it('encrypts the new password', () => {
        const newPassword = 'new password'
        const pwd = new Password('password')
        const before = pwd.hash
        pwd.change(newPassword)
        expect(before).not.to.equal(newPassword)
      })
    })

    describe('verify', () => {
      it('returns true if you provide the right password', () => {
        const plaintext = 'password'
        const pwd = new Password(plaintext)
        expect(pwd.verify(plaintext)).to.equal(true)
      })

      it('returns false if you provide the wrong password', () => {
        const pwd = new Password('password')
        expect(pwd.verify('lolnope')).to.equal(false)
      })
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
