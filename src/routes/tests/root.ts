import { expect } from 'chai'
import request from 'supertest'
import mongoose from 'mongoose'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

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

    it('returns 204', () => {
      expect(res.status).to.equal(204)
    })

    it('returns Allow header', () => {
      expect(res.headers.allow).to.equal('OPTIONS, GET')
    })

    it('returns Access-Control-Allow-Methods header', () => {
      expect(res.headers['access-control-allow-methods']).to.equal('OPTIONS, GET')
    })
  })

  describe('HEAD /', () => {
    beforeEach(async () => {
      res = await request(api).head(base)
    })

    it('returns 204', () => {
      expect(res.status).to.equal(204)
    })
  })

  describe('GET /', () => {
    beforeEach(async () => {
      res = await request(api).get(base)
    })

    it('returns 200', () => {
      expect(res.status).to.equal(200)
    })

    it('directs user to documentation', () => {
      expect(res.body.documentation).to.equal(`${root}/docs`)
    })

    it('lists endpoints', () => {
      expect(res.body.endpoints).to.include(`${root}/otp`)
      expect(res.body.endpoints).to.include(`${root}/pages`)
      expect(res.body.endpoints).to.include(`${root}/path-validator`)
      expect(res.body.endpoints).to.include(`${root}/renderer`)
      expect(res.body.endpoints).to.include(`${root}/tokens`)
      expect(res.body.endpoints).to.include(`${root}/users`)
    })
  })
})
