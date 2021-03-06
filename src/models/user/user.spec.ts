import { expect } from 'chai'
import * as sinon from 'sinon'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import Password from '../password/password.js'
import UserModel from './model.js'
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

  describe('Instance methods', () => {
    describe('getObj', () => {
      it('returns an object', () => {
        const user = new User()
        expect(typeof user.getObj()).to.equal('object')
      })

      it('returns the user ID', () => {
        const user = new User()
        user.id = 'test'
        const actual = user.getObj()
        expect(actual.id).to.equal(user.id)
      })

      it('returns the user\'s active status', () => {
        const user = new User({ active: false })
        const actual = user.getObj()
        expect(actual.active).to.equal(false)
      })

      it('returns the user\'s admin status', () => {
        const user = new User({ admin: true })
        const actual = user.getObj()
        expect(actual.admin).to.equal(true)
      })

      it('returns a string for the hash of the user\'s password', () => {
        const password = 'password'
        const user = new User({ password })
        const actual = user.getObj()
        expect(typeof actual.password).to.equal('string')
      })

      it('does not store the user\'s password in plaintext', () => {
        const password = 'password'
        const user = new User({ password })
        const actual = user.getObj()
        expect(actual.password).not.to.equal(password)
      })

      it('includes the user\'s emails', () => {
        const user = new User()
        const emails = []
        for (let i = 1; i < 4; i++) emails.push(new Email(`test${i}@testing.com`))
        user.emails = emails
        const actual = user.getObj()
        expect(JSON.stringify(actual.emails)).to.equal(JSON.stringify(emails))
      })

      it('includes if the user has enabled OTP', () => {
        const secret = 'shhhhh'
        const otp = new OTP()
        otp.enable(secret)
        const user = new User()
        user.otp = otp
        const actual = user.getObj()
        expect(actual.otp.enabled).to.equal(true)
      })

      it('includes the user\'s secret', () => {
        const secret = 'shhhhh'
        const otp = new OTP()
        otp.enable(secret)
        const user = new User()
        user.otp = otp
        const actual = user.getObj()
        expect(actual.otp.secret).to.equal(secret)
      })
    })

    describe('save', () => {
      const _id = 'abc123'

      afterEach(() => sinon.restore())

      it('creates a new record if the model doesn\'t have an ID', async () => {
        const create = sinon.stub(UserModel, 'create').callsFake((): any => {
          return new Promise(resolve => resolve({ _id }))
        })
        const user = new User()
        await user.save()
        expect(create.callCount).to.equal(1)
      })

      it('sets the new ID if it didn\'t have one before', async () => {
        sinon.stub(UserModel, 'create').callsFake((): any => {
          return new Promise(resolve => resolve({ _id }))
        })
        const user = new User()
        await user.save()
        expect(user.id).to.equal(_id)
      })

      it('updates the record if the model already has an ID', async () => {
        const findOneAndUpdate = sinon.stub(UserModel, 'findOneAndUpdate')
        const user = new User()
        user.id = _id
        await user.save()
        expect(findOneAndUpdate.callCount).to.equal(1)
      })

      it('keeps the existing ID if it already has one', async () => {
        sinon.stub(UserModel, 'findOneAndUpdate')
        const user = new User()
        user.id = _id
        await user.save()
        expect(user.id).to.equal(_id)
      })
    })
  })

  describe('Static methods', () => {
    describe('loadObject', () => {
      const record = {
        _id: '0123456789abcdef12345678',
        active: true,
        admin: false,
        password: 'hash',
        emails: [
          { addr: 'test@testing.com', verified: true, code: 'abc123' }
        ],
        otp: { enabled: false, secret: undefined }
      }

      it('returns a User object', () => {
        const actual = User.loadObject(record)
        expect(actual).to.be.an.instanceOf(User)
      })

      it('loads the user\'s ID', () => {
        const actual = User.loadObject(record)
        expect(actual.id).to.equal(record._id)
      })

      it('loads the user\'s active flag', () => {
        const actual = User.loadObject(record)
        expect(actual.active).to.equal(record.active)
      })

      it('loads the user\'s admin flag', () => {
        const actual = User.loadObject(record)
        expect(actual.admin).to.equal(record.admin)
      })

      it('loads the user\'s password as a Password instance', () => {
        const actual = User.loadObject(record)
        expect(actual.password).to.be.an.instanceOf(Password)
      })

      it('loads the user\'s password hash', () => {
        const actual = User.loadObject(record)
        expect(actual.password.hash).to.equal(record.password)
      })

      it('loads an array of emails', () => {
        const actual = User.loadObject(record)
        expect(actual.emails).to.be.an.instanceOf(Array)
      })

      it('loads elements for each email', () => {
        const actual = User.loadObject(record)
        expect(actual.emails).to.have.lengthOf(record.emails.length)
      })

      it('loads each email as an Email instance', () => {
        const actual = User.loadObject(record)
        expect(actual.emails[0]).to.be.an.instanceOf(Email)
      })

      it('loads the user\'s OTP enabled flag', () => {
        const actual = User.loadObject(record)
        expect(actual.otp.enabled).to.equal(record.otp.enabled)
      })

      it('loads the user\'s OTP secret', () => {
        const actual = User.loadObject(record)
        expect(actual.otp.secret).to.equal(record.otp.secret)
      })
    })
  })
})
