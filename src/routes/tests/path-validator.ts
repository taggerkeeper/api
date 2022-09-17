import { expect } from 'chai'
import request from 'supertest'
import Page from '../../models/page/page.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

describe('Path Validator API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any
  let page: Page
  const allow = 'OPTIONS'

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
    const content = { title: 'Existing Page', path: '/existing', body: 'This is an existing page.' }
    page = new Page({ path: '/existing', revisions: [{ content }] })
    await page.save()
  })

  describe('/path-validator', () => {
    describe('OPTIONS /path-validator', () => {
      beforeEach(async () => {
        const { path } = page.revisions[0].content
        res = await request(api).options(`${base}/path-validator?path=${path}`)
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
