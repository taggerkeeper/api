import { expect } from 'chai'
import request from 'supertest'
import User, { TokenSet } from '../../models/user/user.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

describe('OTP API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any
  const user = new User()
  let tokens: TokenSet
  const allow = 'OPTIONS'

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
  })
})
