import { expect } from 'chai'
import PasswordResetModel from './model.js'

describe('PasswordResetModel', () => {
  describe('constructor', () => {
    it('requires a User ID', () => {
      const actual = new PasswordResetModel()
      const errors = actual.validateSync()
      expect(errors?.errors['user']).not.to.equal(undefined)
    })

    it('requires an email address', () => {
      const actual = new PasswordResetModel()
      const errors = actual.validateSync()
      expect(errors?.errors['email.addr']).not.to.equal(undefined)
    })

    it('validates if given proper data', () => {
      const actual = new PasswordResetModel()
      actual.user = '0123456789abcdef12345678'
      actual.email = { addr: 'test@testing.com', verified: true }
      actual.code = 'abcdefghijklmnopqrstuvwxyz012345'
      actual.expiration = new Date()
      expect(actual.validateSync()).to.equal(undefined)
    })
  })
})
