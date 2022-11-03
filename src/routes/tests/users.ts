import { expect } from 'chai'
import request from 'supertest'
import UserData, { isUserData } from '../../models/user/data.js'
import UserModel from '../../models/user/model.js'
import User from '../../models/user/user.js'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import api from '../../server.js'

import getTokens from './initializers/get-tokens.js'
import hasStatusAndHeaders from './expecters/has-status-and-headers.js'
import isUser from './expecters/is-user.js'
import isEmailArr from './expecters/is-email-arr.js'

describe('Users API', () => {
  let pkg: NPMPackage
  let base: string
  let root: string
  let res: any

  const name = 'Tester'
  const email = 'tester@testing.com'
  const password = 'test password'

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
    root = info.root
  })

  describe('/users', () => {
    const allow = 'OPTIONS, POST'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    describe('OPTIONS /users', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/users`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('POST /users', () => {
      it('returns an error message if there\'s no body', async () => {
        res = await request(api).post(`${base}/users`)
        hasStatusAndHeaders(res, 400, headers)
        expect(res.body.message).to.equal('This method requires a body with elements \'name\', \'email\', and \'password\'')
      })

      it('returns an error message if there\'s only a name', async () => {
        res = await request(api).post(`${base}/users`).send({ name })
        hasStatusAndHeaders(res, 400, headers)
        expect(res.body.message).to.equal('This method requires a body with elements \'email\' and \'password\'')
      })

      it('returns an error message if there\'s only an email', async () => {
        res = await request(api).post(`${base}/users`).send({ email })
        hasStatusAndHeaders(res, 400, headers)
        expect(res.body.message).to.equal('This method requires a body with elements \'name\' and \'password\'')
      })

      it('returns an error message if there\'s only a password', async () => {
        res = await request(api).post(`${base}/users`).send({ password })
        hasStatusAndHeaders(res, 400, headers)
        expect(res.body.message).to.equal('This method requires a body with elements \'name\' and \'email\'')
      })

      it('returns an error message if there\'s only a name and an email', async () => {
        res = await request(api).post(`${base}/users`).send({ name, email })
        hasStatusAndHeaders(res, 400, headers)
        expect(res.body.message).to.equal('This method requires a body with elements \'password\'')
      })

      it('returns an error message if there\'s only a name and a password', async () => {
        res = await request(api).post(`${base}/users`).send({ name, password })
        hasStatusAndHeaders(res, 400, headers)
        expect(res.body.message).to.equal('This method requires a body with elements \'email\'')
      })

      it('returns an error message if there\'s only an email and a password', async () => {
        res = await request(api).post(`${base}/users`).send({ email, password })
        hasStatusAndHeaders(res, 400, headers)
        expect(res.body.message).to.equal('This method requires a body with elements \'name\'')
      })

      it('returns a user object if everything works', async () => {
        res = await request(api).post(`${base}/users`).send({ name, email, password })
        hasStatusAndHeaders(res, 201, headers)
        expect(res.headers.location.startsWith(`${root}/users/`)).to.equal(true)
        isUser(res.body, { name, active: true, admin: false })
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
    const allow = 'OPTIONS, HEAD, GET, PUT'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    beforeEach(async () => {
      user = await UserModel.create({ name })
    })

    describe('OPTIONS /users/:uid', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/users/${user._id?.toString() ?? 'fail'}`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('HEAD /users/:uid', () => {
      beforeEach(async () => {
        res = await request(api).head(`${base}/users/${user._id?.toString() ?? 'fail'}`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('GET /users/:uid', () => {
      beforeEach(async () => {
        res = await request(api).get(`${base}/users/${user._id?.toString() ?? 'fail'}`)
      })

      it('returns a user object', () => {
        hasStatusAndHeaders(res, 200, headers)
        isUser(res.body, { name, active: true, admin: false })
      })
    })

    describe('PUT /users/:uid', () => {
      const user = new User()
      const name = 'New Name'
      const password = 'Longer passwords are still better passwords, even when you change them.'

      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).put(`${base}/users/${user.id ?? ''}`).set(auth).send({ name, password })
        })

        it('sends the user\'s updated data, including the new name', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.name).to.equal(name)
        })

        it('updates the user\'s name and password in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const after = new User(record)
          expect(after.name).to.equal(name)
          expect(after.password.verify(password)).to.equal(true)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          await user.save()
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).put(`${base}/users/${user.id ?? ''}`).set(auth).send({ name, password })
        })

        it('sends the user\'s updated data, including the new name', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.name).to.equal(name)
        })

        it('updates the user\'s name and password in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const after = new User(record)
          expect(after.name).to.equal(name)
          expect(after.password.verify(password)).to.equal(true)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          await user.save()
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).put(`${base}/users/${user.id ?? ''}`).set(auth).send({ name, password })
        })

        it('sends an error message', () => {
          hasStatusAndHeaders(res, 403, headers)
          expect(res.body.message).to.equal('This method requires authentication by the subject or an administrator.')
        })

        it('does not update the user\'s name and password in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const after = new User(record)
          expect(after.name).not.to.equal(name)
          expect(after.password.verify(password)).to.equal(false)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          await user.save()
          res = await request(api).put(`${base}/users/${user.id ?? ''}`).send({ name, password })
        })

        it('sends an error message', () => {
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body.message).to.equal('This method requires authentication.')
        })

        it('does not update the user\'s name and password in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const after = new User(record)
          expect(after.name).not.to.equal(name)
          expect(after.password.verify(password)).to.equal(false)
        })
      })
    })
  })

  describe('/users/:uid/emails', () => {
    const addr = 'tester@testing.com'
    const verified = true
    const emails = [{ addr, verified }]
    const user = new User({ name: 'Subject', emails })
    const allow = 'OPTIONS, HEAD, GET, POST'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    beforeEach(async () => {
      await user.save()
    })

    describe('OPTIONS /users/:uid/emails', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).options(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).options(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).options(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).options(`${base}/users/${user.id ?? ''}/emails`)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })
      })
    })

    describe('GET /users/:uid/emails', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).get(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('returns an array of your emails', () => {
          hasStatusAndHeaders(res, 200, headers)
          isEmailArr(res.body, [{ addr, verified }])
          expect(res.body[0].code).to.equal(undefined)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).get(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('returns an array of the user\'s emails', () => {
          hasStatusAndHeaders(res, 200, headers)
          isEmailArr(res.body, [{ addr, verified }])
          expect(res.body[0].code).to.equal(undefined)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).get(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('does not return the user\'s emails', () => {
          hasStatusAndHeaders(res, 403, headers)
          expect(Array.isArray(res.body)).to.equal(false)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).get(`${base}/users/${user.id ?? ''}/emails`)
        })

        it('does not return the user\'s emails', () => {
          hasStatusAndHeaders(res, 400, headers)
          expect(Array.isArray(res.body)).to.equal(false)
        })
      })
    })

    describe('HEAD /users/:uid/emails', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).head(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('returns 204', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).head(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('returns 204', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).head(`${base}/users/${user.id ?? ''}/emails`).set(auth)
        })

        it('returns 403', () => {
          hasStatusAndHeaders(res, 403, headers)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/users/${user.id ?? ''}/emails`)
        })

        it('returns 401', () => {
          hasStatusAndHeaders(res, 400, headers)
        })
      })
    })

    describe('POST /users/:uid/emails', () => {
      const email = 'newemail@testing.com'

      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/emails`).set(auth).send({ email })
        })

        it('returns an array of your emails', () => {
          hasStatusAndHeaders(res, 201, headers)
          expect(res.headers.location).to.equal(`${root}/users/${user.id ?? ''}/emails/${email}`)
          isEmailArr(res.body, [{ addr, verified }, { addr: email, verified: false }])
          expect(res.body[0].code).to.equal(undefined)
          expect(res.body[1].code).to.equal(undefined)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/emails`).set(auth).send({ email })
        })

        it('returns an array of the user\'s emails', () => {
          hasStatusAndHeaders(res, 201, headers)
          isEmailArr(res.body, [{ addr, verified }, { addr: email, verified: false }])
          expect(res.headers.location).to.equal(`${root}/users/${user.id ?? ''}/emails/${email}`)
          expect(res.body[0].code).to.equal(undefined)
          expect(res.body[1].code).to.equal(undefined)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/emails`).set(auth).send({ email })
        })

        it('does not return the user\'s emails', () => {
          hasStatusAndHeaders(res, 403, headers)
          expect(Array.isArray(res.body)).to.equal(false)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).post(`${base}/users/${user.id ?? ''}/emails`).send({ email })
        })

        it('does not return the user\'s emails', () => {
          hasStatusAndHeaders(res, 400, headers)
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
    const allow = 'OPTIONS, HEAD, GET, PUT, DELETE'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    beforeEach(async () => {
      await user.save()
    })

    describe('OPTIONS /users/:uid/emails/:addr', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).options(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).options(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).options(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).options(`${base}/users/${user.id ?? ''}/emails/${addr}`)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })
      })
    })

    describe('GET /users/:uid/emails/:addr', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).get(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns the email', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.addr).to.equal(addr)
          expect(res.body.verified).to.equal(verified)
          expect(res.body.code).to.equal(undefined)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).get(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns the email', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.addr).to.equal(addr)
          expect(res.body.verified).to.equal(verified)
          expect(res.body.code).to.equal(undefined)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).get(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('doesn\'t return the email', () => {
          hasStatusAndHeaders(res, 403, headers)
          expect(res.body.addr).to.equal(undefined)
          expect(res.body.verified).to.equal(undefined)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).get(`${base}/users/${user.id ?? ''}/emails/${addr}`)
        })

        it('doesn\'t return the email', () => {
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body.addr).to.equal(undefined)
          expect(res.body.verified).to.equal(undefined)
        })
      })
    })

    describe('HEAD /users/:uid/emails/:addr', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).head(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).head(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 204, headers)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).head(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).head(`${base}/users/${user.id ?? ''}/emails/${addr}`)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })
      })
    })

    describe('PUT /users/:uid/emails/:addr', () => {
      beforeEach(async () => {
        user.emails[0].verified = false
        user.emails[0].generateVerificationCode()
        await user.save()
      })

      describe('Self calls', () => {
        beforeEach(async () => {
          const { code } = user.emails[0]
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).put(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth).send({ code })
        })

        it('returns the verified email record', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.addr).to.equal(addr)
          expect(res.body.verified).to.equal(true)
          expect(res.body.code).to.equal(undefined)
        })

        it('saves the verified record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const emails = record.emails ?? []
          expect(emails[0].verified).to.equal(true)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { code } = user.emails[0]
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).put(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth).send({ code })
        })

        it('returns the verified email record', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.addr).to.equal(addr)
          expect(res.body.verified).to.equal(true)
          expect(res.body.code).to.equal(undefined)
        })

        it('saves the verified record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const emails = record.emails ?? []
          expect(emails[0].verified).to.equal(true)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { code } = user.emails[0]
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).put(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth).send({ code })
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })

        it('doesn\'t verify the record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const emails = record.emails ?? []
          expect(emails[0].verified).to.equal(false)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          const { code } = user.emails[0]
          res = await request(api).put(`${base}/users/${user.id ?? ''}/emails/${addr}`).send({ code })
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })

        it('doesn\'t verify the record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const emails = record.emails ?? []
          expect(emails[0].verified).to.equal(false)
        })
      })
    })

    describe('DELETE /users/:uid/emails/:addr', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns the user\'s new email records', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body).to.have.lengthOf(0)
        })

        it('saves the updated user record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const emails = record.emails ?? []
          expect(emails).to.have.lengthOf(0)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('returns the user\'s new email records', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body).to.have.lengthOf(0)
        })

        it('saves the updated user record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const emails = record.emails ?? []
          expect(emails).to.have.lengthOf(0)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/emails/${addr}`).set(auth)
        })

        it('doesn\'t delete the email from the user record in the database', async () => {
          hasStatusAndHeaders(res, 403, headers)
          const record = await UserModel.findById(user.id) as UserData
          const emails = record.emails ?? []
          expect(emails).to.have.lengthOf(1)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/emails/${addr}`)
        })

        it('returns 400', () => {
          hasStatusAndHeaders(res, 400, headers)
        })

        it('doesn\'t delete the email from the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          const emails = record.emails ?? []
          expect(emails).to.have.lengthOf(1)
        })
      })
    })
  })

  describe('/users/:uid/admin', () => {
    const user = new User()
    const allow = 'OPTIONS, HEAD, GET, POST, DELETE'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    beforeEach(async () => {
      await user.save()
    })

    describe('OPTIONS /users/:uid/admin', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/users/${user.id ?? ''}/admin`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('GET /users/:uid/admin', () => {
      it('returns false if the user is not an admin', async () => {
        res = await request(api).get(`${base}/users/${user.id ?? ''}/admin`)
        hasStatusAndHeaders(res, 200, headers)
        expect(res.body).to.equal(false)
      })

      it('returns true if the user is an admin', async () => {
        const admin = new User({ name: 'Admin', admin: true })
        await admin.save()
        res = await request(api).get(`${base}/users/${admin.id ?? ''}/admin`)
        hasStatusAndHeaders(res, 200, headers)
        expect(res.body).to.equal(true)
      })
    })

    describe('HEAD /users/:uid/admin', () => {
      beforeEach(async () => {
        res = await request(api).head(`${base}/users/${user.id ?? ''}/admin`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('POST /users/:uid/admin', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/admin`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })

        it('does not promote the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.admin).to.equal(false)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/admin`).set(auth)
        })

        it('returns the user\'s updated record', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.id).to.equal(user.id)
          expect(res.body.name).to.equal(user.name)
          expect(res.body.admin).to.equal(true)
        })

        it('saves the updated user record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.admin).to.equal(true)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/admin`).set(auth)
        })

        it('does not promote the user record in the database', async () => {
          hasStatusAndHeaders(res, 403, headers)
          const record = await UserModel.findById(user.id) as UserData
          expect(record.admin).to.equal(false)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).post(`${base}/users/${user.id ?? ''}/admin`)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })

        it('does not promote the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.admin).to.equal(false)
        })
      })
    })

    describe('DELETE /users/:uid/admin', () => {
      describe('Self calls', () => {
        beforeEach(async () => {
          user.admin = true
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/admin`).set(auth)
        })

        it('returns the user\'s updated record', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.id).to.equal(user.id)
          expect(res.body.name).to.equal(user.name)
          expect(res.body.admin).to.equal(false)
        })

        it('saves the updated user record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.admin).to.equal(false)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          user.admin = true
          await user.save()
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/admin`).set(auth)
        })

        it('returns the user\'s updated record', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.id).to.equal(user.id)
          expect(res.body.name).to.equal(user.name)
          expect(res.body.admin).to.equal(false)
        })

        it('saves the updated user record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.admin).to.equal(false)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          user.admin = true
          await user.save()
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/admin`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })

        it('does not demote the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.admin).to.equal(true)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          user.admin = true
          await user.save()
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/admin`)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })

        it('does not demote the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.admin).to.equal(true)
        })
      })
    })
  })

  describe('/users/:uid/active', () => {
    const user = new User()
    const allow = 'OPTIONS, HEAD, GET, POST, DELETE'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    beforeEach(async () => {
      await user.save()
    })

    describe('OPTIONS /users/:uid/active', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/users/${user.id ?? ''}/active`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('GET /users/:uid/active', () => {
      it('returns true if the user is active', async () => {
        res = await request(api).get(`${base}/users/${user.id ?? ''}/active`)
        hasStatusAndHeaders(res, 200, headers)
        expect(res.body).to.equal(true)
      })

      it('returns false if the user is not active', async () => {
        const inactive = new User({ name: 'Inactive', active: false })
        await inactive.save()
        res = await request(api).get(`${base}/users/${inactive.id ?? ''}/active`)
        hasStatusAndHeaders(res, 200, headers)
        expect(res.body).to.equal(false)
      })
    })

    describe('HEAD /users/:uid/active', () => {
      beforeEach(async () => {
        res = await request(api).head(`${base}/users/${user.id ?? ''}/active`)
      })

      it('returns status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
      })
    })

    describe('POST /users/:uid/active', () => {
      beforeEach(async () => {
        user.active = false
        await user.save()
      })

      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/active`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })

        it('does not activate the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.active).to.equal(false)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/active`).set(auth)
        })

        it('returns the user\'s updated record', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.id).to.equal(user.id)
          expect(res.body.name).to.equal(user.name)
          expect(res.body.active).to.equal(true)
        })

        it('saves the updated user record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.active).to.equal(true)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).post(`${base}/users/${user.id ?? ''}/active`).set(auth)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 403, headers)
        })

        it('does not activate the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.active).to.equal(false)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).post(`${base}/users/${user.id ?? ''}/active`)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })

        it('does not activate the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.active).to.equal(false)
        })
      })
    })

    describe('DELETE /users/:uid/active', () => {
      beforeEach(async () => {
        user.active = true
        await user.save()
      })

      describe('Self calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/active`).set(auth)
        })

        it('returns 403', () => {
          hasStatusAndHeaders(res, 403, headers)
        })

        it('does not deactivate the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.active).to.equal(true)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ admin: true })
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/active`).set(auth)
        })

        it('returns the user\'s updated record', () => {
          hasStatusAndHeaders(res, 200, headers)
          expect(res.body.id).to.equal(user.id)
          expect(res.body.name).to.equal(user.name)
          expect(res.body.active).to.equal(false)
        })

        it('saves the updated user record to the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.active).to.equal(false)
        })
      })

      describe('Another user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          const auth = { Authorization: `Bearer ${access}` }
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/active`).set(auth)
        })

        it('returns 403', () => {
          hasStatusAndHeaders(res, 403, headers)
        })

        it('does not deactivate the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.active).to.equal(true)
        })
      })

      describe('Anonymous calls', () => {
        beforeEach(async () => {
          res = await request(api).delete(`${base}/users/${user.id ?? ''}/active`)
        })

        it('returns status and headers', () => {
          hasStatusAndHeaders(res, 400, headers)
        })

        it('does not deactivate the user record in the database', async () => {
          const record = await UserModel.findById(user.id) as UserData
          expect(record.active).to.equal(true)
        })
      })
    })
  })
})
