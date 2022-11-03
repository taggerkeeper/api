import { expect } from 'chai'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import OTP from '../../models/otp/otp.js'
import User from '../../models/user/user.js'
import loadUserById from '../../models/user/loaders/by-id.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import getEnvVar from '../../utils/get-env-var.js'
import parseCookie, { CookieInfo } from '../../parse/cookie.js'
import api from '../../server.js'

import hasStatusAndHeaders from './expecters/has-status-and-headers.js'

describe('Tokens API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any

  const secret = getEnvVar('JWT_SECRET') as string
  const password = 'test password'
  const verifiedData = { name: 'User with Verified Email', emails: [{ addr: 'verified@testing.com', verified: true }] }
  const unverifiedData = { name: 'User with Unverified Email', emails: [{ addr: 'unverified@testing.com' }] }
  const enabledData = { name: 'User with OTP Enabled', emails: [{ addr: 'enabled@testing.com', verified: true }], otp: { enabled: true, secret: 'test secret' } }
  let users: User[] = []

  beforeEach(async () => {
    users = []
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
    const { base32 } = await OTP.generate()
    enabledData.otp.secret = base32

    for (const data of [verifiedData, unverifiedData, enabledData]) {
      const user = new User(data)
      user.password.change(password)
      await user.save()
      users.push(user)
    }
  })

  describe('/tokens', () => {
    const allow = 'OPTIONS, POST'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    describe('OPTIONS /tokens', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/tokens`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('POST /tokens', () => {
      it('returns an error if not given any data', async () => {
        res = await request(api).post(`${base}/tokens`)
        hasStatusAndHeaders(res, 400, headers)
      })

      it('returns an error if only given an address', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr })
        hasStatusAndHeaders(res, 400, headers)
      })

      it('returns an error if only given a password', async () => {
        res = await request(api).post(`${base}/tokens`).send({ password })
        hasStatusAndHeaders(res, 400, headers)
      })

      it('returns an error if the password is wrong', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr, password: 'lolnope' })
        hasStatusAndHeaders(res, 400, headers)
      })

      it('returns an error if the email is wrong', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: 'nothere@testing.com', password })
        hasStatusAndHeaders(res, 400, headers)
      })

      it('returns an error if the email isn\'t verified', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: unverifiedData.emails[0].addr, password })
        hasStatusAndHeaders(res, 400, headers)
      })

      it('returns an error if OTP is enabled but no passcode is provided', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: enabledData.emails[0].addr, password })
        hasStatusAndHeaders(res, 400, headers)
      })

      it('returns an error if OTP is enabled and a bad passcode is provided', async () => {
        const valid = speakeasy.totp({ secret: enabledData.otp.secret, encoding: 'base32' })
        const passcode = valid === 'nope' ? 'lolnope' : 'nope'
        res = await request(api).post(`${base}/tokens`).send({ addr: enabledData.emails[0].addr, password, passcode })
        hasStatusAndHeaders(res, 400, headers)
      })

      it('authenticates the user if given a valid, verified email/password combination', async () => {
        res = await request(api).post(`${base}/tokens`).send({ addr: verifiedData.emails[0].addr, password })
        const accessObj = jwt.verify(res.body.token, secret) as any
        const cookie = parseCookie(res.headers['set-cookie'][0])
        const cookieObj = jwt.verify(cookie?.value ?? '', secret) as any
        hasStatusAndHeaders(res, 200, headers)
        expect(res.body.token).to.be.a('string')
        expect(accessObj.name).to.equal(verifiedData.name)
        expect(cookie?.name).to.equal('refresh')
        expect(cookieObj.uid).not.to.equal(undefined)
        expect(cookieObj.refresh).not.to.equal(undefined)
      })

      it('authenticates if given a valid passcode when OTP is enabled', async () => {
        const passcode = speakeasy.totp({ secret: enabledData.otp.secret, encoding: 'base32' })
        res = await request(api).post(`${base}/tokens`).send({ addr: enabledData.emails[0].addr, password, passcode })
        hasStatusAndHeaders(res, 200, headers)
      })
    })
  })

  describe('/tokens/:uid', () => {
    let user: User
    let auth: { Authorization: string }
    const allow = 'OPTIONS, PUT'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    beforeEach(async () => {
      user = users[0]
      await user.save()
      const tokens = await user.generateTokens()
      await user.save()
      auth = { Authorization: `Bearer ${tokens.access}` }
    })

    describe('OPTIONS /tokens/:uid', () => {
      beforeEach(async () => {
        const { id, refresh } = user
        res = await request(api).options(`${base}/tokens/${id ?? ''}`).send({ refresh })
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('PUT /tokens/:uid', () => {
      describe('When no refresh is given', () => {
        beforeEach(async () => {
          const { id } = user
          const path = `${base}/tokens/${id ?? ''}`
          res = await request(api).put(path).set(auth)
        })

        it('provides an error message', () => {
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body.message).to.equal('This method requires a body with elements \'refresh\'')
        })
      })

      describe('When the refresh is incorrect', () => {
        beforeEach(async () => {
          const { id, refresh } = user
          const path = `${base}/tokens/${id ?? ''}`
          res = await request(api).put(path).send({ refresh: refresh === '111' ? '000' : '111' }).set(auth)
        })

        it('provides an error message', () => {
          const authenticate = 'Bearer error="invalid_token" error_description="The access token could not be verified."'
          hasStatusAndHeaders(res, 401, Object.assign({}, headers, { 'www-authenticate': authenticate }))
          expect(res.body.message).to.equal('Could not verify refresh token.')
        })
      })

      describe('When it works', () => {
        let accessObject: any
        let cookieObject: any
        let cookie: CookieInfo

        beforeEach(async () => {
          const { id, refresh } = user
          const path = `${base}/tokens/${id ?? ''}`
          res = await request(api).put(path).send({ refresh }).set(auth)
          accessObject = jwt.verify(res.body.token, secret) as any
          cookie = parseCookie(res.headers['set-cookie'][0]) as CookieInfo
          cookieObject = jwt.verify(cookie?.value ?? '', secret) as any
        })

        it('returns an access token and refresh token', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.token).to.be.a('string')
          expect(accessObject.name).to.equal(user.name)
          expect(cookie?.name).to.equal('refresh')
          expect(cookieObject.uid).to.equal(user.id)
          expect(cookieObject.refresh).not.to.equal(undefined)
        })

        it('sets a new refresh', async () => {
          const { id, refresh } = user
          const record = id !== undefined ? await loadUserById(id) : null
          expect(record?.refresh).not.to.equal(refresh)
        })
      })
    })
  })
})
