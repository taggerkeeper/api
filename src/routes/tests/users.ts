import { expect } from 'chai'
import request from 'supertest'
import UserData, { isUserData } from '../../models/user/data.js'
import UserModel from '../../models/user/model.js'
import User, { TokenSet } from '../../models/user/user.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

describe('Users API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any

  const name = 'Tester'
  const email = 'tester@testing.com'
  const password = 'test password'

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/users', () => {
    describe('OPTIONS /users', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/users`)
      })

      it('returns 204', () => {
        expect(res.status).to.equal(204)
      })

      it('returns Allow header', () => {
        expect(res.headers.allow).to.equal('OPTIONS, POST')
      })

      it('returns Access-Control-Allow-Methods header', () => {
        expect(res.headers['access-control-allow-methods']).to.equal('OPTIONS, POST')
      })
    })

    describe('POST /users', () => {
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

  describe('/users/:uid', () => {
    let user: UserData

    beforeEach(async () => {
      user = await UserModel.create({ name })
    })

    describe('OPTIONS /users/:uid', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/users/${user._id?.toString() ?? 'fail'}`)
      })

      it('returns 204', () => {
        expect(res.status).to.equal(204)
      })

      it('returns Allow header', () => {
        expect(res.headers.allow).to.equal('OPTIONS, GET, HEAD')
      })

      it('returns Access-Control-Allow-Methods header', () => {
        expect(res.headers['access-control-allow-methods']).to.equal('OPTIONS, GET, HEAD')
      })
    })

    describe('HEAD /users/:uid', () => {
      beforeEach(async () => {
        res = await request(api).head(`${base}/users/${user._id?.toString() ?? 'fail'}`)
      })

      it('returns 204', () => {
        expect(res.status).to.equal(204)
      })
    })

    describe('GET /users/:uid', () => {
      beforeEach(async () => {
        res = await request(api).get(`${base}/users/${user._id?.toString() ?? 'fail'}`)
      })

      it('returns 200', () => {
        expect(res.status).to.equal(200)
      })

      it('returns a user object', () => {
        expect(res.body.name).to.equal(name)
        expect(res.body.active).to.equal(true)
        expect(res.body.admin).to.equal(false)
        expect(res.body.id).not.to.equal(undefined)
      })
    })
  })

  describe('/users/:uid/emails', () => {
    const addr = 'tester@testing.com'
    const verified = true
    const emails = [{ addr, verified }]
    const user = new User({ name: 'Subject', emails })
    let tokens: TokenSet

    beforeEach(async () => {
      await user.save()
    })

    describe('OPTIONS /users/:uid/emails', () => {
      const expected = 'OPTIONS, GET, HEAD, POST'

      describe('Self calls', () => {
        beforeEach(async () => {
          await user.save()
          tokens = await user.generateTokens()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).options(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 204', () => {
          expect(res.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(expected)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(expected)
        })
      })

      describe('Admin calls', () => {
        const admin = new User({ name: 'Admin', admin: true })

        beforeEach(async () => {
          await admin.save()
          tokens = await admin.generateTokens()
          await admin.save()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).options(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 204', () => {
          expect(res.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(expected)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(expected)
        })
      })

      describe('Another user calls', () => {
        const other = new User({ name: 'Other' })

        beforeEach(async () => {
          await other.save()
          tokens = await other.generateTokens()
          await other.save()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).options(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(expected)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(expected)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          await user.save()
          res = await request(api).options(`${base}/users/${user.id}/emails`)
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(expected)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(expected)
        })
      })
    })

    describe('GET /users/:uid/emails', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          await user.save()
          tokens = await user.generateTokens()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).get(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 200', () => {
          expect(res.status).to.equal(200)
        })

        it('returns an array of your emails', () => {
          expect(res.body).to.have.lengthOf(1)
          expect(res.body[0].addr).to.equal(addr)
          expect(res.body[0].verified).to.equal(verified)
        })
      })

      describe('Admin calls', () => {
        const admin = new User({ name: 'Admin', admin: true })

        beforeEach(async () => {
          await admin.save()
          tokens = await admin.generateTokens()
          await admin.save()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).get(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 200', () => {
          expect(res.status).to.equal(200)
        })

        it('returns an array of the user\'s emails', () => {
          expect(res.body).to.have.lengthOf(1)
          expect(res.body[0].addr).to.equal(addr)
          expect(res.body[0].verified).to.equal(verified)
        })
      })

      describe('Another user calls', () => {
        const other = new User({ name: 'Other' })

        beforeEach(async () => {
          await other.save()
          tokens = await other.generateTokens()
          await other.save()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).get(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })

        it('does not return the user\'s emails', () => {
          expect(Array.isArray(res.body)).to.equal(false)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          await user.save()
          res = await request(api).get(`${base}/users/${user.id}/emails`)
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })

        it('does not return the user\'s emails', () => {
          expect(Array.isArray(res.body)).to.equal(false)
        })
      })
    })

    describe('HEAD /users/:uid/emails', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          await user.save()
          tokens = await user.generateTokens()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).head(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 201', () => {
          expect(res.status).to.equal(201)
        })
      })

      describe('Admin calls', () => {
        const admin = new User({ name: 'Admin', admin: true })

        beforeEach(async () => {
          await admin.save()
          tokens = await admin.generateTokens()
          await admin.save()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).head(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 201', () => {
          expect(res.status).to.equal(201)
        })
      })

      describe('Another user calls', () => {
        const other = new User({ name: 'Other' })

        beforeEach(async () => {
          await other.save()
          tokens = await other.generateTokens()
          await other.save()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).head(`${base}/users/${user.id}/emails`).set(auth)
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          await user.save()
          res = await request(api).head(`${base}/users/${user.id}/emails`)
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })
      })
    })

    describe('POST /users/:uid/emails', () => {
      const email = 'newemail@testing.com'

      describe('Self calls', () => {
        beforeEach(async () => {
          await user.save()
          tokens = await user.generateTokens()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).post(`${base}/users/${user.id}/emails`).set(auth).send({ email })
        })

        it('returns 200', () => {
          expect(res.status).to.equal(200)
        })

        it('returns an array of your emails', () => {
          expect(res.body).to.have.lengthOf(2)
          expect(res.body[0].addr).to.equal(addr)
          expect(res.body[0].verified).to.equal(verified)
          expect(res.body[1].addr).to.equal(email)
          expect(res.body[1].verified).to.equal(false)
        })
      })

      describe('Admin calls', () => {
        const admin = new User({ name: 'Admin', admin: true })

        beforeEach(async () => {
          await admin.save()
          tokens = await admin.generateTokens()
          await admin.save()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).post(`${base}/users/${user.id}/emails`).set(auth).send({ email })
        })

        it('returns 200', () => {
          expect(res.status).to.equal(200)
        })

        it('returns an array of the user\'s emails', () => {
          expect(res.body).to.have.lengthOf(2)
          expect(res.body[0].addr).to.equal(addr)
          expect(res.body[0].verified).to.equal(verified)
          expect(res.body[1].addr).to.equal(email)
          expect(res.body[1].verified).to.equal(false)
        })
      })

      describe('Another user calls', () => {
        const other = new User({ name: 'Other' })

        beforeEach(async () => {
          await other.save()
          tokens = await other.generateTokens()
          await other.save()
          await user.save()
          const auth = { Authorization: `Bearer ${tokens.access}` }
          res = await request(api).post(`${base}/users/${user.id}/emails`).set(auth).send({ email })
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })

        it('does not return the user\'s emails', () => {
          expect(Array.isArray(res.body)).to.equal(false)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          await user.save()
          res = await request(api).post(`${base}/users/${user.id}/emails`).send({ email })
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })

        it('does not return the user\'s emails', () => {
          expect(Array.isArray(res.body)).to.equal(false)
        })
      })
    })
  })

  describe('/users/:uid/emails/:addr', () => {
    const addr = 'tester@testing.com'
    const verified = true
    const emails = [{ addr, verified }]
    const user = new User({ name: 'Subject', emails })
    let tokens: TokenSet

    beforeEach(async () => {
      await user.save()
    })

    describe('OPTIONS /users/:uid/emails/:addr', () => {
      const expected = 'OPTIONS'

      describe('Self calls', () => {
        beforeEach(async () => {
          await user.save()
          tokens = await user.generateTokens()
          await user.save()
          const auth = {Authorization: `Bearer ${tokens.access}`}
          res = await request(api).options(`${base}/users/${user.id}/emails/${addr}`).set(auth)
        })

        it('returns 204', () => {
          expect(res.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(expected)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(expected)
        })
      })

      describe('Admin calls', () => {
        const admin = new User({ name: 'Admin', admin: true })

        beforeEach(async () => {
          await admin.save()
          tokens = await admin.generateTokens()
          await admin.save()
          await user.save()
          const auth = {Authorization: `Bearer ${tokens.access}`}
          res = await request(api).options(`${base}/users/${user.id}/emails/${addr}`).set(auth)
        })

        it('returns 204', () => {
          expect(res.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(expected)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(expected)
        })
      })

      describe('Another user calls', () => {
        const other = new User({ name: 'Other' })

        beforeEach(async () => {
          await other.save()
          tokens = await other.generateTokens()
          await other.save()
          await user.save()
          const auth = {Authorization: `Bearer ${tokens.access}`}
          res = await request(api).options(`${base}/users/${user.id}/emails/${addr}`).set(auth)
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(expected)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(expected)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          await user.save()
          res = await request(api).options(`${base}/users/${user.id}/emails/${addr}`)
        })

        it('returns 401', () => {
          expect(res.status).to.equal(401)
        })

        it('returns Allow header', () => {
          expect(res.headers.allow).to.equal(expected)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(res.headers['access-control-allow-methods']).to.equal(expected)
        })
      })
    })
  })
})
