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
  const allow = 'OPTIONS, HEAD, GET'

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/path-validator', () => {
    describe('OPTIONS /path-validator', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/path-validator?path=/test`)
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

    describe('HEAD /path-validator', () => {
      describe('Validating a null string', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/path-validator?path=`)
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

      describe('Validating a path with a reserved word', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/path-validator?path=/login/more`)
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

      describe('Validating a path that already exists', () => {
        let existing: Page
        const path = '/existing'

        beforeEach(async () => {
          const content = { title: 'Existing Page', path, body: 'This page already exists.' }
          existing = new Page({ path, revisions: [{ content }] })
          await existing.save()
          res = await request(api).head(`${base}/path-validator?path=${path}`)
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

      describe('Validating a valid path', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/path-validator?path=/valid`)
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
      })
    })

    describe('GET /path-validator', () => {
      describe('Validating a null string', () => {
        beforeEach(async () => {
          res = await request(api).get(`${base}/path-validator?path=`)
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
          expect(res.body.message).to.equal('A null string is not a valid path.')
        })
      })

      describe('Validating a path with a reserved word', () => {
        beforeEach(async () => {
          res = await request(api).get(`${base}/path-validator?path=/login/more`)
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
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('Validating a path that already exists', () => {
        let existing: Page
        const path = '/existing'

        beforeEach(async () => {
          const content = { title: 'Existing Page', path, body: 'This page already exists.' }
          existing = new Page({ path, revisions: [{ content }] })
          await existing.save()
          res = await request(api).get(`${base}/path-validator?path=${path}`)
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
          expect(res.body.message).to.equal(`The path ${path} is already in use.`)
        })
      })

      describe('Validating a valid path', () => {
        const path = '/valid'

        beforeEach(async () => {
          res = await request(api).get(`${base}/path-validator?path=${path}`)
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

        it('returns a confirmation message', () => {
          expect(res.body.message).to.equal(`The path ${path} is valid.`)
        })
      })
    })
  })
})
