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
      let create: sinon.SinonStub
      let del: sinon.SinonStub

      beforeEach(() => {
        create = sinon.stub(PasswordResetModel, 'create')
        del = sinon.stub(PasswordResetModel, 'deleteMany')
      })

      afterEach(() => sinon.restore())

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

    describe('loadObject', () => {
      const addr = 'test@testing.com'
      const record = {
        user: {
          _id: '0123456789abcdef12345678',
          active: true,
          admin: false,
          password: 'hash',
          emails: [
            { addr, verified: true, code: 'email-verification-code' }
          ],
          otp: { enabled: false, secret: 'shhhhh' }
        },
        email: { addr, verified: true, code: 'email-verification-code' },
        code: 'abc123',
        expiration: new Date()
      }

      it('throws an error if only given a User ID', () => {
        const badFn = (): PasswordReset => PasswordReset.loadObject({
          user: '0123456789abcdef12345678',
          email: { addr, verified: true, code: 'email-verification-code' },
          code: 'abc123',
          expiration: new Date()
        })
        const msg = 'PasswordReset.loadObject can only load password reset records on which the user has been populated.'
        expect(badFn).to.throw(msg)
      })

      it('loads a User instance', () => {
        const actual = PasswordReset.loadObject(record)
        expect(actual.user).to.be.an.instanceOf(User)
      })

      it('loads the email as an Email instance', () => {
        const actual = PasswordReset.loadObject(record)
        expect(actual.email).to.be.an.instanceOf(Email)
      })

      it('loads the email address', () => {
        const actual = PasswordReset.loadObject(record)
        expect(actual.email.addr).to.equal(addr)
      })

      it('loads the code', () => {
        const actual = PasswordReset.loadObject(record)
        expect(actual.code).to.equal(record.code)
      })

      it('loads the expiration as a Date', () => {
        const actual = PasswordReset.loadObject(record)
        expect(actual.expiration).to.be.an.instanceOf(Date)
      })

      it('loads the expiration', () => {
        const actual = PasswordReset.loadObject(record)
        expect(actual.expiration).to.equal(record.expiration)
      })
    })
  })
})
