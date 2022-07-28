import { expect } from 'chai'
import * as sinon from 'sinon'
import Email from '../email/email.js'
import User from '../user/user.js'
import UserModel from '../user/model.js'
import PasswordReset from './password-reset.js'
import PasswordResetModel from './model.js'

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

    it('can be given a code', () => {
      const code = 'abc123'
      const user = new User()
      const email = new Email('test@testing.com', true)
      const reset = new PasswordReset(user, email, code)
      expect(reset.code).to.equal(code)
    })

    it('expires in 30 minutes by default', () => {
      const before = new Date()
      before.setTime(before.getTime() + 1920000)
      const user = new User()
      const email = new Email('test@testing.com', true)
      const reset = new PasswordReset(user, email)
      expect(reset.expiration).to.be.below(before)
    })

    it('can be given an expiration', () => {
      const expiration = new Date()
      expiration.setTime(expiration.getTime() + 5000)
      const user = new User()
      const email = new Email('test@testing.com', true)
      const reset = new PasswordReset(user, email, undefined, expiration)
      expect(reset.expiration).to.equal(expiration)
    })
  })

  describe('Instance methods', () => {
    describe('save', () => {
      const user = new User()
      const email = new Email('test@testing.com', true)
      const create = sinon.stub(PasswordResetModel, 'create')
      const del = sinon.stub(PasswordResetModel, 'deleteMany')

      afterEach(() => sinon.resetHistory())
      after(() => sinon.restore())

      it('deletes all existing resets for that email', async () => {
        const reset = new PasswordReset(user, email)
        await reset.save()
        const args = del.firstCall.args
        expect((args[0] as any)['email.addr']).to.equal(email.addr)
      })

      it('creates a new reset', async () => {
        const reset = new PasswordReset(user, email)
        await reset.save()
        expect(create.callCount).to.equal(1)
      })
    })
  })

  describe('Static methods', () => {
    afterEach(() => sinon.restore())

    describe('create', () => {
      it('returns a reset for each user with the given email address', async () => {
        const addr = 'test@testing.com'
        sinon.stub(UserModel, 'find').callsFake((): any => {
          return new Promise(resolve => resolve([
            { _id: 'testA', active: true, admin: false, password: 'hash', emails: [{ addr, verified: true }], otp: { enabled: false } },
            { _id: 'testB', active: true, admin: false, password: 'hash', emails: [{ addr, verified: true }], otp: { enabled: false } },
            { _id: 'testC', active: true, admin: false, password: 'hash', emails: [{ addr, verified: true }], otp: { enabled: false } }
          ]))
        })

        const resets = await PasswordReset.create(addr)
        const actual = resets.map(reset => reset.constructor.name)
        expect(actual.join(' ')).to.equal('PasswordReset PasswordReset PasswordReset')
      })
    })
  })
})
