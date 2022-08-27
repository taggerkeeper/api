import { expect } from 'chai'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import OTP from '../../models/otp/otp.js'
import User from '../../models/user/user.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import getEnvVar from '../../utils/get-env-var.js'
import parseCookie from '../../parse/cookie.js'
import api from '../../server.js'

describe('Tokens API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any

  const secret = getEnvVar('JWT_SECRET') as string
  const password = 'test password'
  const verifiedData = { name: 'User with Verified Email', emails: [{ addr: 'verified@testing.com', verified: true }] }
  const unverifiedData = { name: 'User with Unverified Email', emails: [{ addr: 'unverified@testing.com' }] }
  const enabledData = { name: 'User with OTP Enabled', emails: [{ addr: 'enabled@testing.com', verified: true }], otp: { enabled: true, secret: 'test secret' } }

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
    const { base32 } = await OTP.generate()
    enabledData.otp.secret = base32

    for (const data of [verifiedData, unverifiedData, enabledData]) {
      const user = new User(data)
      user.password.change(password)
      await user.save()
    }
  })

  describe('/tokens', () => {
    describe('OPTIONS /tokens', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/tokens`)
      })

      it('returns 204', () => {
        expect(res.status).to.equal(204)
      })

      it('returns Allow header', () => {
        expect(res.headers.allow).to.equal('OPTIONS, POST')
      })

      it('returns Access-Control-Allow-Methods header', () => {
        expect(res.headers['access-control-allow-methods']).to.equal('OPTIONS, POST')
      })
    })

    describe('POST /tokens', () => {
      it('returns 401 if not given a body', async () => {
        res = await request(api).post(`${base}/tokens`)
        expect(res.status).to.equal(401)
      })

      it('returns 401 if only given an email', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr })
        expect(res.status).to.equal(401)
      })

      it('returns 401 if only given a password', async () => {
        res = await request(api).post(`${base}/tokens`).send({ password })
        expect(res.status).to.equal(401)
      })

      it('returns 401 if given a valid email with a bad password', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr, password: 'lolnope' })
        expect(res.status).to.equal(401)
      })

      it('returns 401 if given an email that doesn\'t exist with a password that does', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: 'nothere@testing.com', password })
        expect(res.status).to.equal(401)
      })

      it('returns 401 if given a valid email/password combination but the email isn\'t verified', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: unverifiedData.emails[0].addr, password })
        expect(res.status).to.equal(401)
      })

      it('returns 200 if given a valid, verified email/password combination', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr, password })
        expect(res.status).to.equal(200)
      })

      it('returns an access token', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr, password })
        expect(res.body.token).to.be.a('string')
      })

      it('returns a JSON web token with the user\'s data', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr, password })
        const obj = jwt.verify(res.body.token, secret) as any
        expect(obj.name).to.equal(verifiedData.name)
      })

      it('returns a refresh token as a cookie', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr, password })
        const cookie = parseCookie(res.headers['set-cookie'][0])
        expect(cookie?.name).to.equal('refresh')
      })

      it('returns a JSON web token as a cookie', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr, password })
        const cookie = parseCookie(res.headers['set-cookie'][0])
        const obj = jwt.verify(cookie?.value ?? '', secret) as any
        expect(obj.uid).not.to.equal(undefined)
        expect(obj.refresh).not.to.equal(undefined)
      })

      it('returns 401 if not given a passcode when OTP is enabled', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: enabledData.emails[0].addr, password })
        expect(res.status).to.equal(401)
      })

      it('returns 401 if given a bad passcode when OTP is enabled', async () => {
        const valid = speakeasy.totp({ secret: enabledData.otp.secret, encoding: 'base32' })
        const passcode = valid === 'nope' ? 'lolnope' : 'nope'
        res = await request(api).post(`${base}/tokens`).send({ addr: enabledData.emails[0].addr, password, passcode })
        expect(res.status).to.equal(401)
      })

      it('returns 200 if given a valid passcode when OTP is enabled', async () => {
        const passcode = speakeasy.totp({ secret: enabledData.otp.secret, encoding: 'base32' })
        res = await request(api).post(`${base}/tokens`).send({ addr: enabledData.emails[0].addr, password, passcode })
        expect(res.status).to.equal(200)
      })
    })
  })
})
