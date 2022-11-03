import { expect } from 'chai'
import request from 'supertest'
import validDataUrl from 'valid-data-url'
import speakeasy from 'speakeasy'
import User, { TokenSet } from '../../models/user/user.js'
import OTP from '../../models/otp/otp.js'
import loadUserById from '../../models/user/loaders/by-id.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

import hasStatusAndHeaders from './expecters/has-status-and-headers.js'

describe('OTP API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any
  const user = new User()
  let tokens: TokenSet

  beforeEach(async () => {
    await user.save()
    tokens = await user.generateTokens()
    await user.save()
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/otp', () => {
    const allow = 'OPTIONS, HEAD, GET, POST, DELETE'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    describe('OPTIONS /otp', () => {
      describe('No authorization', () => {
        beforeEach(async () => {
          res = await request(api).options(`${base}/otp`)
        })

        it('returns an error message', () => {
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body.message).to.equal('This method requires authentication.')
        })
      })

      describe('Deactivated user authorization', () => {
        beforeEach(async () => {
          const deactivated = new User({ name: 'Deactivated User', active: false })
          await deactivated.save()
          tokens = await deactivated.generateTokens()
          await deactivated.save()
          res = await request(api).options(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns an error message', () => {
          hasStatusAndHeaders(res, 403, headers)
          expect(res.body.message).to.equal('Your account has been deactivated.')
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).options(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })
    })

    describe('HEAD /otp', () => {
      describe('No authorization', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/otp`)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })
      })

      describe('Deactivated user authorization', () => {
        beforeEach(async () => {
          const deactivated = new User({ name: 'Deactivated User', active: false })
          await deactivated.save()
          tokens = await deactivated.generateTokens()
          await deactivated.save()
          res = await request(api).head(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })
    })

    describe('GET /otp', () => {
      describe('No authorization', () => {
        beforeEach(async () => {
          res = await request(api).get(`${base}/otp`)
        })

        it('returns an error message', () => {
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body.message).to.equal('This method requires authentication.')
        })
      })

      describe('Deactivated user authorization', () => {
        beforeEach(async () => {
          const deactivated = new User({ name: 'Deactivated User', active: false })
          await deactivated.save()
          tokens = await deactivated.generateTokens()
          await deactivated.save()
          res = await request(api).get(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns an error message', () => {
          hasStatusAndHeaders(res, 403, headers)
          expect(res.body.message).to.equal('Your account has been deactivated.')
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).get(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns a QR code', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(validDataUrl(res.text)).to.equal(true)
        })

        it('stores the secret to the user account', async () => {
          const after = await loadUserById(user.id ?? '')
          expect(after?.otp.secret).not.to.equal(undefined)
          expect(after?.otp.enabled).to.equal(false)
        })
      })
    })

    describe('POST /otp', () => {
      let code: string

      beforeEach(async () => {
        const { base32 } = await OTP.generate()
        user.otp.enable(base32)
        await user.save()
        code = speakeasy.totp({ secret: base32, encoding: 'base32' })
      })

      describe('No authorization', () => {
        beforeEach(async () => {
          res = await request(api).post(`${base}/otp`).send({ code })
        })

        it('returns an error message', () => {
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body.message).to.equal('This method requires authentication.')
        })
      })

      describe('Deactivated user authorization', () => {
        beforeEach(async () => {
          const deactivated = new User({ name: 'Deactivated User', active: false })
          await deactivated.save()
          tokens = await deactivated.generateTokens()
          await deactivated.save()
          res = await request(api).post(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` }).send({ code })
        })

        it('returns an error message', () => {
          hasStatusAndHeaders(res, 403, headers)
          expect(res.body.message).to.equal('Your account has been deactivated.')
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).post(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` }).send({ code })
        })

        it('returns a message and your user ID', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.message).to.equal('OTP verified and enabled.')
          expect(res.body.id).to.equal(user.id)
        })

        it('enables OTP on the user account', async () => {
          const after = await loadUserById(user.id ?? '')
          expect(after?.otp.secret).not.to.equal(undefined)
          expect(after?.otp.enabled).to.equal(true)
        })
      })
    })

    describe('DELETE /otp', () => {
      beforeEach(async () => {
        const { base32 } = await OTP.generate()
        user.otp.enable(base32)
        await user.save()
      })

      describe('No authorization', () => {
        beforeEach(async () => {
          res = await request(api).delete(`${base}/otp`)
        })

        it('returns an error message', () => {
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body.message).to.equal('This method requires authentication.')
        })
      })

      describe('Deactivated user authorization', () => {
        beforeEach(async () => {
          const deactivated = new User({ name: 'Deactivated User', active: false })
          await deactivated.save()
          tokens = await deactivated.generateTokens()
          await deactivated.save()
          res = await request(api).delete(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns an error message', () => {
          hasStatusAndHeaders(res, 403, headers)
          expect(res.body.message).to.equal('Your account has been deactivated.')
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).delete(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns a message and your user ID', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.message).to.equal('OTP disabled.')
          expect(res.body.id).to.equal(user.id)
        })

        it('disables OTP on the user account', async () => {
          const after = await loadUserById(user.id ?? '')
          expect(after?.otp.secret).to.equal(undefined)
          expect(after?.otp.enabled).to.equal(false)
        })
      })
    })
  })
})
