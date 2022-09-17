import { expect } from 'chai'
import request from 'supertest'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

describe('Renderer API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any
  const allow = 'OPTIONS'

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/renderer', () => {
    describe('OPTIONS /renderer', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/renderer`)
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
