import { expect } from 'chai'
import request from 'supertest'
import User from '../../models/user/user.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

describe('Tokens API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any

  const name = 'Tester'
  const user = new User({ name })

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
    await user.save()
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
        expect(res.headers.allow).to.equal('OPTIONS')
      })

      it('returns Access-Control-Allow-Methods header', () => {
        expect(res.headers['access-control-allow-methods']).to.equal('OPTIONS')
      })
    })
  })
})
