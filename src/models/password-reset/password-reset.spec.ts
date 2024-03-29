import { expect } from 'chai'
import * as sinon from 'sinon'
import Email from '../email/email.js'
import User from '../user/user.js'
import UserModel from '../user/model.js'
import PasswordReset from './password-reset.js'
import PasswordResetModel from './model.js'
import { isPasswordResetData } from './data.js'

describe('PasswordReset', () => {
  describe('constructor', () => {
    it('assigns the user given', () => {
      const user = new User({ name: 'Admin', admin: true, password: 'hash' })
      const email = new Email()
      const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
      expect(JSON.stringify(reset.user)).to.equal(JSON.stringify(user))
    })

    it('assigns the email given', () => {
      const user = new User()
      const email = new Email({ addr: 'test@testing.com', verified: true })
      const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
      expect(JSON.stringify(reset.email)).to.equal(JSON.stringify(email))
    })

    it('creates a random 32-character code', () => {
      const user = new User()
      const email = new Email({ addr: 'test@testing.com', verified: true })
      const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
      expect(reset.code).to.have.lengthOf(32)
    })

    it('can be given a code', () => {
      const code = 'abc123'
      const user = new User()
      const email = new Email({ addr: 'test@testing.com', verified: true })
      const reset = new PasswordReset({ user: user.getObj(), email: email.getObj(), code })
      expect(reset.code).to.equal(code)
    })

    it('expires in 30 minutes by default', () => {
      const before = new Date()
      before.setTime(before.getTime() + 1920000)
      const user = new User()
      const email = new Email({ addr: 'test@testing.com', verified: true })
      const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
      expect(reset.expiration).to.be.below(before)
    })

    it('can be given an expiration', () => {
      const expiration = new Date()
      expiration.setTime(expiration.getTime() + 5000)
      const user = new User()
      const email = new Email({ addr: 'test@testing.com', verified: true })
      const reset = new PasswordReset({ user: user.getObj(), email: email.getObj(), expiration })
      expect(reset.expiration).to.equal(expiration)
    })
  })

  describe('Instance methods', () => {
    let user: User
    const email = new Email({ addr: 'test@testing.com', verified: true })

    describe('getObj', () => {
      it('returns an object', () => {
        user = new User()
        const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
        const actual = reset.getObj()
        expect(typeof actual).to.equal('object')
      })

      it('returns a PasswordResetData object', () => {
        user = new User()
        const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
        const actual = reset.getObj()
        expect(isPasswordResetData(actual)).to.equal(true)
      })
    })

    describe('use', () => {
      const _id = '0123456789abcdef12345678'
      const newPasswd = 'this is my new password'
      let create: sinon.SinonStub
      let del: sinon.SinonStub

      beforeEach(() => {
        user = new User()
        create = sinon.stub(UserModel, 'create').callsFake((): any => {
          return new Promise(resolve => resolve({ _id }))
        })
        del = sinon.stub(PasswordResetModel, 'deleteMany')
      })

      afterEach(() => sinon.restore())

      it('changes the user\'s password', async () => {
        const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
        await reset.use(newPasswd)
        expect(reset.user.password.verify(newPasswd)).to.equal(true)
      })

      it('saves the user', async () => {
        const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
        await reset.use(newPasswd)
        expect(create.callCount).to.equal(1)
      })

      it('deletes all your resets', async () => {
        const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
        await reset.use(newPasswd)
        expect(del.callCount).to.equal(1)
      })
    })

    describe('save', () => {
      let create: sinon.SinonStub
      let del: sinon.SinonStub

      beforeEach(() => {
        create = sinon.stub(PasswordResetModel, 'create')
        del = sinon.stub(PasswordResetModel, 'deleteMany')
      })

      afterEach(() => sinon.restore())

      it('deletes all existing resets for that email', async () => {
        const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
        await reset.save()
        const args = del.firstCall.args
        expect((args[0])['email.addr']).to.equal(email.addr)
      })

      it('creates a new reset', async () => {
        const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
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
