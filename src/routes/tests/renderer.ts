import { expect } from 'chai'
import request from 'supertest'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

describe('Renderer API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any
  const allow = 'OPTIONS, HEAD, GET'
  const text = 'Some text is **bolded**, and some is in _italics_.'
  const expected = '<p>Some text is <strong>bolded</strong>, and some is in <em>italics</em>.</p>'

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/renderer', () => {
    describe('OPTIONS /renderer', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/renderer?text=${text}`)
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

    describe('HEAD /renderer', () => {
      beforeEach(async () => {
        res = await request(api).head(`${base}/renderer?text=${text}`)
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

    describe('GET /renderer', () => {
      beforeEach(async () => {
        res = await request(api).get(`${base}/renderer?text=${text}`)
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

      it('returns the rendered text', () => {
        expect(res.text).to.equal(expected)
      })
    })
  })
})
