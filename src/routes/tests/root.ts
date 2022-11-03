import { expect } from 'chai'
import request from 'supertest'
import mongoose from 'mongoose'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

import hasStatusAndHeaders from './expecters/has-status-and-headers.js'

const clearDatabase = async (): Promise<void> => {
  await Promise.all(Object.values(mongoose.connection.collections).map(async (coll) => { await coll.deleteMany({}) }))
}

beforeEach(async () => { await clearDatabase() })
afterEach(async () => { await clearDatabase() })

describe('API Root', () => {
  let pkg: NPMPackage
  let base: string
  let root: string
  let res: any

  const allow = 'OPTIONS, GET'
  const headers = {
    allow,
    'access-control-allow-methods': allow
  }

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
    root = info.root
  })

  describe('OPTIONS /', () => {
    beforeEach(async () => {
      res = await request(api).options(base)
    })

    it('returns status and headers', () => {
      hasStatusAndHeaders(res, 204, headers)
    })
  })

  describe('HEAD /', () => {
    beforeEach(async () => {
      res = await request(api).head(base)
    })

    it('returns status and headers', () => {
      hasStatusAndHeaders(res, 204, headers)
    })
  })

  describe('GET /', () => {
    beforeEach(async () => {
      res = await request(api).get(base)
    })

    it('returns status and headers', () => {
      hasStatusAndHeaders(res, 200, headers)
    })

    it('directs user to documentation', () => {
      expect(res.body.documentation).to.equal(`${root}/docs`)
    })

    it('lists endpoints', () => {
      expect(res.body.endpoints).to.include(`${root}/otp`)
      expect(res.body.endpoints).to.include(`${root}/pages`)
      expect(res.body.endpoints).to.include(`${root}/renderer`)
      expect(res.body.endpoints).to.include(`${root}/tokens`)
      expect(res.body.endpoints).to.include(`${root}/users`)
    })
  })
})
