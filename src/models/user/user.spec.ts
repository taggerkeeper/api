import { expect } from 'chai'
import * as sinon from 'sinon'
import jwt from 'jsonwebtoken'
import Email from '../email/email.js'
import OTP from '../otp/otp.js'
import Password from '../password/password.js'
import UserModel from './model.js'
import User, { TokenSet } from './user.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import getFirstVal from '../../utils/get-first-val.js'
import getEnvVar from '../../utils/get-env-var.js'

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

    it('doesn\'t set a refresh by default', () => {
      const user = new User()
      expect(user.refresh).to.equal(undefined)
    })

    it('lets you set the refresh', () => {
      const refresh = 'refreshing'
      const user = new User({ name, refresh })
      expect(user.refresh).to.equal(refresh)
    })

    it('creates an empty array for emails by default', () => {
      const user = new User()
      expect(JSON.stringify(user.emails)).to.equal('[]')
    })

    it('lets you set the number of emails', () => {
      const user = new User({ name, emails: [{ addr: 'test1@testing.com' }, { addr: 'test2@testing.com' }] })
      expect(user.emails).to.have.lengthOf(2)
    })

    it('turns each email into an Email instance', () => {
      const user = new User({ name, emails: [{ addr: 'test1@testing.com' }, { addr: 'test2@testing.com' }] })
      expect(user.emails[0]).to.be.an.instanceOf(Email)
      expect(user.emails[1]).to.be.an.instanceOf(Email)
    })

    it('lets you set the email addresses', () => {
      const user = new User({ name, emails: [{ addr: 'test1@testing.com' }, { addr: 'test2@testing.com' }] })
      const actual = user.emails.map(email => email.addr).join(' ')
      expect(actual).to.equal('test1@testing.com test2@testing.com')
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

    describe('generateTokens', () => {
      const name = 'Tester'
      const uid = '0123456789abcdef12345678'
      const user = new User({ id: uid, name })
      const secret = getEnvVar('JWT_SECRET') as string
      let tokens: TokenSet

      beforeEach(async () => {
        tokens = await user.generateTokens()
      })

      it('generates a refresh JWT that includes the user\'s ID', () => {
        const obj = jwt.verify(tokens.refresh, secret) as any
        expect(obj.uid).to.equal(uid)
      })

      it('generates a refresh JWT that includes the user\'s refresh code', () => {
        const obj = jwt.verify(tokens.refresh, secret) as any
        expect(obj.refresh).to.equal(user?.refresh)
      })

      it('generates a refresh JWT that includes the issuer', async () => {
        const pkg = await loadPackage()
        const { host } = getAPIInfo(pkg)
        const obj = jwt.verify(tokens.refresh, secret) as any
        expect(obj.iss).to.equal(host)
      })

      it('generates a refresh JWT that includes the subject', async () => {
        const pkg = await loadPackage()
        const { root } = getAPIInfo(pkg)
        const subject = `${root}/users/${uid}`
        const obj = jwt.verify(tokens.refresh, secret) as any
        expect(obj.sub).to.equal(subject)
      })

      it('generates a refresh JWT the includes the expiration', async () => {
        const now = new Date()
        const refreshExpires = getFirstVal(getEnvVar('REFRESH_EXPIRES'), 86400000) as number
        const limit = (now.getTime() / 1000) + refreshExpires + 5
        const obj = jwt.verify(tokens.refresh, secret) as any
        expect(obj.exp).to.be.at.most(limit)
      })

      it('generates an access JWT that includes the user\'s public information', () => {
        const obj = jwt.verify(tokens.access, secret) as any
        const actual = [obj.id, obj.name].join(' ')
        const expected = [uid, name].join(' ')
        expect(actual).to.equal(expected)
      })

      it('generates an access JWT that includes the isuer', async () => {
        const pkg = await loadPackage()
        const { host } = getAPIInfo(pkg)
        const obj = jwt.verify(tokens.access, secret) as any
        expect(obj.iss).to.equal(host)
      })

      it('generates an access JWT that includes the subject', async () => {
        const pkg = await loadPackage()
        const { root } = getAPIInfo(pkg)
        const subject = `${root}/users/${uid}`
        const obj = jwt.verify(tokens.access, secret) as any
        expect(obj.sub).to.equal(subject)
      })

      it('generates an access JWT that includes the expiration', async () => {
        const now = new Date()
        const tokenExpires = getFirstVal(getEnvVar('JWT_EXPIRES'), 300) as number
        const limit = (now.getTime() / 1000) + tokenExpires + 5
        const obj = jwt.verify(tokens.access, secret) as any
        expect(obj.exp).to.be.at.most(limit)
      })

      it('generates the expiration for the refresh cookie', async () => {
        const now = new Date()
        const tokenExpires = getFirstVal(getEnvVar('JWT_EXPIRES'), 300) as number
        const limit = (now.getTime() / 1000) + tokenExpires + 5
        expect(tokens.refreshExpires).to.be.at.most(limit)
      })

      it('generates the domain for the refresh cookie', async () => {
        const pkg = await loadPackage()
        const { host } = getAPIInfo(pkg as NPMPackage)
        expect(tokens.domain).to.equal(host)
      })

      it('generates a refresh token', async () => {
        const user = new User()
        await user.generateTokens()
        expect(user.refresh).to.be.a('string')
      })

      it('generates a 64-character refresh token', async () => {
        await user.generateTokens()
        expect(user.refresh).to.have.lengthOf(64)
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
