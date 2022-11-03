import { expect } from 'chai'
import request from 'supertest'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

import hasStatusAndHeaders from './expecters/has-status-and-headers.js'

describe('Renderer API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any
  const text = 'Some text is **bolded**, and some is in _italics_.'
  const expected = '<p>Some text is <strong>bolded</strong>, and some is in <em>italics</em>.</p>'

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/renderer', () => {
    const allow = 'OPTIONS, HEAD, GET'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    describe('OPTIONS /renderer', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/renderer?text=${text}`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('HEAD /renderer', () => {
      beforeEach(async () => {
        res = await request(api).head(`${base}/renderer?text=${text}`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 200, headers)
      })
    })

    describe('GET /renderer', () => {
      beforeEach(async () => {
        res = await request(api).get(`${base}/renderer?text=${text}`)
      })

      it('returns the rendered text', () => {
        hasStatusAndHeaders(res, 200, headers)
        expect(res.text).to.equal(expected)
      })
    })
  })
})
