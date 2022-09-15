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

describe('OTP API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any
  const user = new User()
  let tokens: TokenSet
  const allow = 'OPTIONS, HEAD, GET, POST, DELETE'

  beforeEach(async () => {
    await user.save()
    tokens = await user.generateTokens()
    await user.save()
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/otp', () => {
    describe('OPTIONS /otp', () => {
      describe('No authorization', () => {
        beforeEach(async () => {
          res = await request(api).options(`${base}/otp`)
        })

        it('returns 400', () => {
          expect(res.status).to.equal(400)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message', () => {
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

        it('returns 403', () => {
          expect(res.status).to.equal(403)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message', () => {
          expect(res.body.message).to.equal('Your account has been deactivated.')
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).options(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns 204', () => {
          expect(res.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })
      })
    })

    describe('HEAD /otp', () => {
      describe('No authorization', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/otp`)
        })

        it('returns 400', () => {
          expect(res.status).to.equal(400)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
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

        it('returns 403', () => {
          expect(res.status).to.equal(403)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns 204', () => {
          expect(res.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })
      })
    })

    describe('GET /otp', () => {
      describe('No authorization', () => {
        beforeEach(async () => {
          res = await request(api).get(`${base}/otp`)
        })

        it('returns 400', () => {
          expect(res.status).to.equal(400)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message', () => {
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

        it('returns 403', () => {
          expect(res.status).to.equal(403)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message', () => {
          expect(res.body.message).to.equal('Your account has been deactivated.')
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).get(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns 200', () => {
          expect(res.status).to.equal(200)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns a QR code', () => {
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

        it('returns 400', () => {
          expect(res.status).to.equal(400)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message', () => {
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

        it('returns 403', () => {
          expect(res.status).to.equal(403)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message', () => {
          expect(res.body.message).to.equal('Your account has been deactivated.')
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).post(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` }).send({ code })
        })

        it('returns 200', () => {
          expect(res.status).to.equal(200)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns a message', () => {
          expect(res.body.message).to.equal('OTP verified and enabled.')
        })

        it('returns your user ID', () => {
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

        it('returns 400', () => {
          expect(res.status).to.equal(400)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message', () => {
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

        it('returns 403', () => {
          expect(res.status).to.equal(403)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message', () => {
          expect(res.body.message).to.equal('Your account has been deactivated.')
        })
      })

      describe('Proper authorization', () => {
        beforeEach(async () => {
          res = await request(api).delete(`${base}/otp`).set({ Authorization: `Bearer ${tokens.access}` })
        })

        it('returns 200', () => {
          expect(res.status).to.equal(200)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns a message', () => {
          expect(res.body.message).to.equal('OTP disabled.')
        })

        it('returns your user ID', () => {
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
