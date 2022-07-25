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

    it('expires in 30 minutes by default', () => {
      const before = new Date()
      before.setTime(before.getTime() + 1920000)
      const user = new User()
      const email = new Email('test@testing.com', true)
      const reset = new PasswordReset(user, email)
      expect(reset.expiration).to.be.below(before)
    })
  })

  describe('Instance methods', () => {
    describe('save', () => {
      const _id = 'abc123'
      const user = new User()
      const email = new Email('test@testing.com', true)

      afterEach(() => sinon.restore())

      it('creates a new record if the model doesn\'t have an ID', async () => {
        const create = sinon.stub(PasswordResetModel, 'create').callsFake((): any => {
          return new Promise(resolve => resolve({ _id }))
        })
        const reset = new PasswordReset(user, email)
        await reset.save()
        expect(create.callCount).to.equal(1)
      })

      it('sets the new ID if it didn\'t have one before', async () => {
        sinon.stub(PasswordResetModel, 'create').callsFake((): any => {
          return new Promise(resolve => resolve({ _id }))
        })
        const reset = new PasswordReset(user, email)
        await reset.save()
        expect(reset.id).to.equal(_id)
      })

      it('updates the record if the model already has an ID', async () => {
        const findOneAndUpdate = sinon.stub(PasswordResetModel, 'findOneAndUpdate')
        const reset = new PasswordReset(user, email)
        reset.id = _id
        await reset.save()
        expect(findOneAndUpdate.callCount).to.equal(1)
      })

      it('keeps the existing ID if it already has one', async () => {
        sinon.stub(PasswordResetModel, 'findOneAndUpdate')
        const reset = new PasswordReset(user, email)
        reset.id = _id
        await reset.save()
        expect(reset.id).to.equal(_id)
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
