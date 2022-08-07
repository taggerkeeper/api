import { expect } from 'chai'
import * as sinon from 'sinon'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import Password from '../password/password.js'
import UserModel from './model.js'
import User from './user.js'

describe('User', () => {
  describe('constructor', () => {
    const id = '0123456789abcdef12345678'
    const name = 'Tester'

    it('returns a User instance', () => {
      const user = new User()
      expect(user).to.be.instanceOf(User)
    })

    it('sets the ID from _id', () => {
      const user = new User({ _id: id, name })
      expect(user.id).to.equal(id)
    })

    it('sets the ID from id', () => {
      const user = new User({ id, name })
      expect(user.id).to.equal(id)
    })

    it('sets the name', () => {
      const user = new User({ name })
      expect(user.name).to.equal(name)
    })

    it('sets active to true by default', () => {
      const user = new User()
      expect(user.active).to.equal(true)
    })

    it('lets you set the active flag', () => {
      const user = new User({ name, active: false })
      expect(user.active).to.equal(false)
    })

    it('sets admin to false by default', () => {
      const user = new User()
      expect(user.admin).to.equal(false)
    })

    it('lets you set the admin flag', () => {
      const user = new User({ name, admin: true })
      expect(user.admin).to.equal(true)
    })

    it('sets a random password by default', () => {
      const user = new User()
      expect(user.password).to.be.instanceOf(Password)
    })

    it('lets you set the password', () => {
      const password = 'password'
      const user = new User({ name, password })
      expect(user.password.hash).to.equal(password)
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
        const user = new User({ name: 'Tester', active: false })
        const actual = user.getObj()
        expect(actual.active).to.equal(false)
      })

      it('returns the user\'s admin status', () => {
        const user = new User({ name: 'Tester', admin: true })
        const actual = user.getObj()
        expect(actual.admin).to.equal(true)
      })

      it('returns a string for the hash of the user\'s password', () => {
        const password = 'password'
        const user = new User({ name: 'Tester', password })
        const actual = user.getObj()
        expect(typeof actual.password).to.equal('string')
      })

      it('includes the user\'s emails', () => {
        const user = new User()
        const emails = []
        for (let i = 1; i < 4; i++) emails.push(new Email({ addr: `test${i}@testing.com` }))
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
        expect(actual.otp?.enabled).to.equal(true)
      })

      it('includes the user\'s secret', () => {
        const secret = 'shhhhh'
        const otp = new OTP()
        otp.enable(secret)
        const user = new User()
        user.otp = otp
        const actual = user.getObj()
        expect(actual.otp?.secret).to.equal(secret)
      })
    })

    describe('getPublicObj', () => {
      it('returns an object', () => {
        const user = new User()
        expect(typeof user.getPublicObj()).to.equal('object')
      })

      it('returns the user ID', () => {
        const user = new User()
        user.id = 'test'
        const actual = user.getPublicObj()
        expect(actual.id).to.equal(user.id)
      })

      it('returns the user\'s active status', () => {
        const user = new User({ name: 'Tester', active: false })
        const actual = user.getPublicObj()
        expect(actual.active).to.equal(false)
      })

      it('returns the user\'s admin status', () => {
        const user = new User({ name: 'Tester', admin: true })
        const actual = user.getPublicObj()
        expect(actual.admin).to.equal(true)
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
        const user = new User({ _id, name: 'Tester' })
        await user.save()
        expect(findOneAndUpdate.callCount).to.equal(1)
      })

      it('keeps the existing ID if it already has one', async () => {
        sinon.stub(UserModel, 'findOneAndUpdate')
        const user = new User({ _id, name: 'Tester' })
        await user.save()
        expect(user.id).to.equal(_id)
      })
    })
  })
})
