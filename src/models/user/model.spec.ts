import chai from 'chai'
import chaiString from 'chai-string'
import UserModel from './model.js'

chai.use(chaiString)
const { expect } = chai

describe('UserModel', () => {
  describe('constructor', () => {
    it('doesn\'t have an ID by default', () => {
      const actual = new UserModel()
      const errors = actual.validateSync()
      expect(errors).to.equal(undefined)
    })

    it('defaults to a randomly-selected anonymous something-or-other', () => {
      const actual = new UserModel()
      expect(actual.name).to.startWith('Anonymous ')
    })

    it('defaults to active', () => {
      const actual = new UserModel()
      expect(actual.active).to.equal(true)
    })

    it('can be set to inactive', () => {
      const actual = new UserModel({ active: false })
      expect(actual.active).to.equal(false)
    })

    it('defaults to not admin', () => {
      const actual = new UserModel()
      expect(actual.admin).to.equal(false)
    })

    it('can be set to admin', () => {
      const actual = new UserModel({ admin: true })
      expect(actual.admin).to.equal(true)
    })

    it('defaults to no password hash', () => {
      const actual = new UserModel()
      expect(actual.password).to.equal(undefined)
    })

    it('can set a password hash', () => {
      const password = 'abc123'
      const actual = new UserModel({ password })
      expect(actual.password).to.equal(password)
    })

    it('defaults to an empty array of emails', () => {
      const actual = new UserModel()
      expect(JSON.stringify(actual.emails)).to.equal('[]')
    })

    it('can include an email', () => {
      const emails = [{ addr: 'test@testing.com', verified: false }]
      const model = new UserModel({ emails })
      const actual = model.emails?.map(email => ({ addr: email.addr, verified: email.verified }))
      expect(JSON.stringify(actual)).to.equal(JSON.stringify(emails))
    })

    it('can include many emails', () => {
      const emails = [
        { addr: 'test1@testing.com', verified: true },
        { addr: 'test2@testing.com', verified: true },
        { addr: 'test3@testing.com', verified: false }
      ]
      const model = new UserModel({ emails })
      const actual = model.emails?.map(email => ({ addr: email.addr, verified: email.verified }))
      expect(JSON.stringify(actual)).to.equal(JSON.stringify(emails))
    })

    it('defaults to having OTP disabled', () => {
      const actual = new UserModel()
      expect(actual.otp?.enabled).to.equal(false)
    })

    it('can enable OTP', () => {
      const actual = new UserModel({ otp: { enabled: true } })
      expect(actual.otp?.enabled).to.equal(true)
    })

    it('defaults to having no OTP secret', () => {
      const actual = new UserModel()
      expect(actual.otp?.secret).to.equal(undefined)
    })

    it('can save an OTP secret', () => {
      const secret = 'shhhhh'
      const actual = new UserModel({ otp: { secret } })
      expect(actual.otp?.secret).to.equal(secret)
    })

    it('won\'t let you enable OTP without a secret', () => {
      const actual = new UserModel({ otp: { enabled: true } })
      const errors = actual.validateSync()
      expect(errors?.errors['otp.enabled']).not.to.equal(undefined)
    })

    it('will let you enable OTP with a secret', () => {
      const actual = new UserModel({ otp: { enabled: true, secret: 'shhhhh' } })
      const errors = actual.validateSync()
      expect(errors?.errors['otp.enabled']).to.equal(undefined)
    })
  })

  describe('Static methods', () => {
    describe('generateRandomName', () => {
      it('returns a string', () => {
        const name = UserModel.generateRandomName()
        expect(name).to.be.a('string')
      })

      it('returns an anonymous something-or-other', () => {
        const name = UserModel.generateRandomName()
        expect(name).to.startWith('Anonymous ')
      })
    })
  })
})
