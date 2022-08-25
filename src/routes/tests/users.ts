import chai, { expect } from 'chai'
import request from 'supertest'
import { isUserData } from '../../models/user/data.js'
import UserModel from '../../models/user/model.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

describe('/users', () => {
  let pkg: NPMPackage
  let base: string
  let res: any

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('OPTIONS /users', () => {
    beforeEach(async () => {
      res = await request(api).options(`${base}/users`)
    })

    it('returns 204', () => {
      expect(res.status).to.equal(204)
    })

    it('returns Allow header', () => {
      expect(res.headers['allow']).to.equal('OPTIONS, POST')
    })

    it('returns Access-Control-Allow-Methods header', () => {
      expect(res.headers['access-control-allow-methods']).to.equal('OPTIONS, POST')
    })
  })

  describe('POST /users', () => {
    const name = 'Tester'
    const email = 'tester@testing.com'
    const password = 'test password'

    it('returns 400 if there\'s no body', async () => {
      res = await request(api).post(`${base}/users`)
      expect(res.status).to.equal(400)
    })

    it('returns an error message if there\'s no body', async () => {
      res = await request(api).post(`${base}/users`)
      expect(res.body.message).to.equal('This method requires a body with elements \'name\', \'email\', and \'password\'')
    })

    it('returns 400 if there\'s only a name', async () => {
      res = await request(api).post(`${base}/users`).send({ name })
      expect(res.status).to.equal(400)
    })

    it('returns an error message if there\'s only a name', async () => {
      res = await request(api).post(`${base}/users`).send({ name })
      expect(res.body.message).to.equal('This method requires a body with elements \'email\' and \'password\'')
    })

    it('returns 400 if there\'s only an email', async () => {
      res = await request(api).post(`${base}/users`).send({ email })
      expect(res.status).to.equal(400)
    })

    it('returns an error message if there\'s only an email', async () => {
      res = await request(api).post(`${base}/users`).send({ email })
      expect(res.body.message).to.equal('This method requires a body with elements \'name\' and \'password\'')
    })

    it('returns 400 if there\'s only a password', async () => {
      res = await request(api).post(`${base}/users`).send({ password })
      expect(res.status).to.equal(400)
    })

    it('returns an error message if there\'s only a password', async () => {
      res = await request(api).post(`${base}/users`).send({ password })
      expect(res.body.message).to.equal('This method requires a body with elements \'name\' and \'email\'')
    })

    it('returns 400 if there\'s only a name and an email', async () => {
      res = await request(api).post(`${base}/users`).send({ name, email })
      expect(res.status).to.equal(400)
    })

    it('returns an error message if there\'s only a name and an email', async () => {
      res = await request(api).post(`${base}/users`).send({ name, email })
      expect(res.body.message).to.equal('This method requires a body with elements \'password\'')
    })

    it('returns 400 if there\'s only a name and a password', async () => {
      res = await request(api).post(`${base}/users`).send({ name, password })
      expect(res.status).to.equal(400)
    })

    it('returns an error message if there\'s only a name and a password', async () => {
      res = await request(api).post(`${base}/users`).send({ name, password })
      expect(res.body.message).to.equal('This method requires a body with elements \'email\'')
    })

    it('returns 400 if there\'s only an email and a password', async () => {
      res = await request(api).post(`${base}/users`).send({ email, password })
      expect(res.status).to.equal(400)
    })

    it('returns an error message if there\'s only an email and a password', async () => {
      res = await request(api).post(`${base}/users`).send({ email, password })
      expect(res.body.message).to.equal('This method requires a body with elements \'name\'')
    })

    it('returns 201 if everything works', async () => {
      res = await request(api).post(`${base}/users`).send({ name, email, password })
      expect(res.status).to.equal(201)
    })

    it('returns a user object if everything works', async () => {
      res = await request(api).post(`${base}/users`).send({ name, email, password })
      expect(res.body.name).to.equal(name)
      expect(res.body.active).to.equal(true)
      expect(res.body.admin).to.equal(false)
      expect(res.body.id).not.to.equal(undefined)
    })

    it('adds a user to the database if everything works', async () => {
      res = await request(api).post(`${base}/users`).send({ name, email, password })
      const record = await UserModel.findById(res.body.id)
      expect(isUserData(record)).to.equal(true)
    })
  })
})
