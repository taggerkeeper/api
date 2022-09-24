import { expect } from 'chai'
import request from 'supertest'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import getAPIInfo from '../../utils/get-api-info.js'
import { PermissionLevel } from '../../models/permissions/data.js'
import Page from '../../models/page/page.js'
import User from '../../models/user/user.js'
import api from '../../server.js'

const parseLinks = (header: string): any => {
  const links: any = {}
  const coll = header.split(',').map(link => link.trim())
  coll.forEach(link => {
    const match = link.match(/<(.*?)>; rel="(.*?)"/i)
    if (match !== null && match.length > 2) {
      links[match[2]] = match[1]
    }
  })
  return links
}

const runSearchTest = async (base: string, method: 'head' | 'get' = 'get'): Promise<any> => {
  const users = {
    authenticated: new User(),
    editor: new User(),
    admin: new User({ name: 'Admin', admin: true })
  }

  await users.authenticated.save()
  await users.editor.save()
  await users.admin.save()

  const tokens = {
    authenticated: await users.authenticated.generateTokens(),
    editor: await users.editor.generateTokens(),
    admin: await users.admin.generateTokens()
  }

  await users.authenticated.save()
  await users.editor.save()
  await users.admin.save()

  for (let i = 1; i <= 10; i++) {
    const page = new Page({ revisions: [{ content: { title: `Test Page #${i}`, path: `/test-${i}`, body: 'This is a test page.' } }] })
    await page.save()
  }

  const authOnly = new Page({ revisions: [{ content: { title: 'Authenticated Only', path: '/auth', body: 'Authenticated only.' }, permissions: { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated } }] })
  const editorOnly = new Page({ revisions: [{ content: { title: 'Editor Only', path: '/editor', body: 'Editor only.' }, permissions: { read: PermissionLevel.editor, write: PermissionLevel.editor }, editor: users.editor.getObj() }] })
  const adminOnly = new Page({ revisions: [{ content: { title: 'Admin Only', path: '/admin', body: 'Admin only.' }, permissions: { read: PermissionLevel.admin, write: PermissionLevel.admin } }] })

  await authOnly.save()
  await editorOnly.save()
  await adminOnly.save()

  const url = `${base}/pages?created-after=0&offset=4&limit=2`
  const fn = method === 'head' ? request(api).head : request(api).get
  return {
    anonymous: await fn(url),
    authenticated: await fn(url).set({ Authorization: `Bearer ${tokens.authenticated.access}` }),
    editor: await fn(url).set({ Authorization: `Bearer ${tokens.editor.access}` }),
    admin: await fn(url).set({ Authorization: `Bearer ${tokens.admin.access}` })
  }
}

describe('Pages API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any
  const allow = 'OPTIONS, HEAD, GET'

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/pages', () => {
    let results: any

    describe('OPTIONS /pages', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/pages`)
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

    describe('HEAD /pages', () => {
      beforeEach(async () => {
        results = await runSearchTest(base, 'head')
      })

      describe('Anonymous calls', () => {
        it('returns 204', () => {
          expect(results.anonymous.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(results.anonymous.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(results.anonymous.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns link headers', () => {
          const rels = Object.keys(parseLinks(results.anonymous.headers.link))
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
        })

        it('returns X-Total-Count header', () => {
          expect(results.anonymous.headers['x-total-count']).to.equal('10')
        })
      })

      describe('Authenticated calls', () => {
        it('returns 204', () => {
          expect(results.authenticated.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(results.authenticated.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(results.authenticated.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns link headers', () => {
          const rels = Object.keys(parseLinks(results.authenticated.headers.link))
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
        })

        it('returns X-Total-Count header', () => {
          expect(results.authenticated.headers['x-total-count']).to.equal('11')
        })
      })

      describe('Editor calls', () => {
        it('returns 204', () => {
          expect(results.editor.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(results.editor.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(results.editor.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns link headers', () => {
          const rels = Object.keys(parseLinks(results.editor.headers.link))
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
        })

        it('returns X-Total-Count header', () => {
          expect(results.editor.headers['x-total-count']).to.equal('12')
        })
      })

      describe('Admin calls', () => {
        it('returns 204', () => {
          expect(results.admin.status).to.equal(204)
        })

        it('returns Allow header', () => {
          expect(results.admin.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(results.admin.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns link headers', () => {
          const rels = Object.keys(parseLinks(results.admin.headers.link))
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
        })

        it('returns X-Total-Count header', () => {
          expect(results.admin.headers['x-total-count']).to.equal('13')
        })
      })
    })

    describe('GET /pages', () => {
      beforeEach(async () => {
        results = await runSearchTest(base)
      })

      describe('Anonymous calls', () => {
        it('returns 200', () => {
          expect(results.anonymous.status).to.equal(200)
        })

        it('returns Allow header', () => {
          expect(results.anonymous.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(results.anonymous.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns link headers', () => {
          const rels = Object.keys(parseLinks(results.anonymous.headers.link))
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
        })

        it('returns X-Total-Count header', () => {
          expect(results.anonymous.headers['x-total-count']).to.equal('10')
        })

        it('returns your results', () => {
          expect(results.anonymous.body.total).to.equal(10)
          expect(results.anonymous.body.start).to.equal(4)
          expect(results.anonymous.body.end).to.equal(6)
          expect(results.anonymous.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Authenticated calls', () => {
        it('returns 200', () => {
          expect(results.authenticated.status).to.equal(200)
        })

        it('returns Allow header', () => {
          expect(results.authenticated.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(results.authenticated.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns link headers', () => {
          const rels = Object.keys(parseLinks(results.authenticated.headers.link))
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
        })

        it('returns X-Total-Count header', () => {
          expect(results.authenticated.headers['x-total-count']).to.equal('11')
        })

        it('returns your results', () => {
          expect(results.authenticated.body.total).to.equal(11)
          expect(results.authenticated.body.start).to.equal(4)
          expect(results.authenticated.body.end).to.equal(6)
          expect(results.authenticated.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Editor calls', () => {
        it('returns 200', () => {
          expect(results.editor.status).to.equal(200)
        })

        it('returns Allow header', () => {
          expect(results.editor.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(results.editor.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns link headers', () => {
          const rels = Object.keys(parseLinks(results.editor.headers.link))
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
        })

        it('returns X-Total-Count header', () => {
          expect(results.editor.headers['x-total-count']).to.equal('12')
        })

        it('returns your results', () => {
          expect(results.editor.body.total).to.equal(12)
          expect(results.editor.body.start).to.equal(4)
          expect(results.editor.body.end).to.equal(6)
          expect(results.editor.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Admin calls', () => {
        it('returns 200', () => {
          expect(results.admin.status).to.equal(200)
        })

        it('returns Allow header', () => {
          expect(results.admin.headers.allow).to.equal(allow)
        })

        it('returns Access-Control-Allow-Methods header', () => {
          expect(results.admin.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns link headers', () => {
          const rels = Object.keys(parseLinks(results.admin.headers.link))
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
        })

        it('returns X-Total-Count header', () => {
          expect(results.admin.headers['x-total-count']).to.equal('13')
        })

        it('returns your results', () => {
          expect(results.admin.body.total).to.equal(13)
          expect(results.admin.body.start).to.equal(4)
          expect(results.admin.body.end).to.equal(6)
          expect(results.admin.body.pages).to.have.lengthOf(2)
        })
      })
    })
  })
})