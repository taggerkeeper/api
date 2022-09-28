import { expect } from 'chai'
import request from 'supertest'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import loadPageById from '../../models/page/loaders/by-id.js'
import getAPIInfo from '../../utils/get-api-info.js'
import { PermissionLevel } from '../../models/permissions/data.js'
import ContentData from '../../models/content/data.js'
import PermissionsData from '../../models/permissions/data.js'
import Page from '../../models/page/page.js'
import PageModel from '../../models/page/model.js'
import RevisionData from '../../models/revision/data.js'
import User, { TokenSet } from '../../models/user/user.js'
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

const initUser = async (user: User): Promise<{Authorization: string}> => {
  await user.save()
  const tokens = await user.generateTokens()
  await user.save()
  return { Authorization: `Bearer ${tokens.access}` }
}

const testPageLoad = async (base: string, method: string = 'GET', page: Page, auth?: { Authorization: string }): Promise<{ id: any, path: any }> => {
  await page.save()
  const fn = method === 'HEAD' ? request(api).head : request(api).get
  const idUrl = `${base}/pages/${page.id ?? ''}`
  const pathUrl = `${base}/pages${page.revisions[0].content.path ?? ''}`
  const id = auth === undefined ? await fn(idUrl) : await fn(idUrl).set(auth)
  const path = auth === undefined ? await fn(pathUrl) : await fn(pathUrl).set(auth)
  return { id, path }
}

describe('Pages API', () => {
  let pkg: NPMPackage
  let base: string
  let res: any

  beforeEach(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  describe('/pages', () => {
    const allow = 'OPTIONS, HEAD, GET, POST'
    let results: any

    describe('OPTIONS /pages', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/pages`)
      })

      it('returns correct status and headers', () => {
        expect(res.status).to.equal(204)
        expect(res.headers.allow).to.equal(allow)
        expect(res.headers['access-control-allow-methods']).to.equal(allow)
      })
    })

    describe('HEAD /pages', () => {
      beforeEach(async () => {
        results = await runSearchTest(base, 'head')
      })

      describe('Anonymous calls', () => {
        it('returns correct status and headers', () => {
          const rels = Object.keys(parseLinks(results.anonymous.headers.link))
          expect(results.anonymous.status).to.equal(204)
          expect(results.anonymous.headers.allow).to.equal(allow)
          expect(results.anonymous.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(results.anonymous.headers['x-total-count']).to.equal('10')
        })
      })

      describe('Authenticated calls', () => {
        it('returns correct status and headers', () => {
          const rels = Object.keys(parseLinks(results.authenticated.headers.link))
          expect(results.authenticated.status).to.equal(204)
          expect(results.authenticated.headers.allow).to.equal(allow)
          expect(results.authenticated.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(results.authenticated.headers['x-total-count']).to.equal('11')
        })
      })

      describe('Editor calls', () => {
        it('returns correct status and headers', () => {
          const rels = Object.keys(parseLinks(results.editor.headers.link))
          expect(results.editor.status).to.equal(204)
          expect(results.editor.headers.allow).to.equal(allow)
          expect(results.editor.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(results.editor.headers['x-total-count']).to.equal('12')
        })
      })

      describe('Admin calls', () => {
        it('returns correct status and headers', () => {
          const rels = Object.keys(parseLinks(results.admin.headers.link))
          expect(results.admin.status).to.equal(204)
          expect(results.admin.headers.allow).to.equal(allow)
          expect(results.admin.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(results.admin.headers['x-total-count']).to.equal('13')
        })
      })
    })

    describe('GET /pages', () => {
      beforeEach(async () => {
        results = await runSearchTest(base)
      })

      describe('Anonymous calls', () => {
        it('returns correct status and headers', () => {
          const rels = Object.keys(parseLinks(results.anonymous.headers.link))
          expect(results.anonymous.status).to.equal(200)
          expect(results.anonymous.headers.allow).to.equal(allow)
          expect(results.anonymous.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
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
        it('returns correct status and headers', () => {
          const rels = Object.keys(parseLinks(results.authenticated.headers.link))
          expect(results.authenticated.status).to.equal(200)
          expect(results.authenticated.headers.allow).to.equal(allow)
          expect(results.authenticated.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
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
        it('returns correct status and headers', () => {
          const rels = Object.keys(parseLinks(results.editor.headers.link))
          expect(results.editor.status).to.equal(200)
          expect(results.editor.headers.allow).to.equal(allow)
          expect(results.editor.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
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
        it('returns correct status and headers', () => {
          const rels = Object.keys(parseLinks(results.admin.headers.link))
          expect(results.admin.status).to.equal(200)
          expect(results.admin.headers.allow).to.equal(allow)
          expect(results.admin.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
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

    describe('POST /pages', () => {
      const data = {
        title: 'New Page',
        body: 'This is a new page.'
      }

      beforeEach(async () => {
        res = await request(api).post(`${base}/pages`).send(data)
      })

      it('returns correct status and headers', () => {
        expect(res.status).to.equal(201)
        expect(res.headers.allow).to.equal(allow)
        expect(res.headers['access-control-allow-methods']).to.equal(allow)
        expect(res.headers.location).not.to.equal(undefined)
      })

      it('creates a new page', async () => {
        const elems = res.headers.location.split('/')
        const id = elems[elems.length - 1]
        const page = await PageModel.findById(id)
        const rev = page?.revisions[0]
        expect(page).not.to.equal(null)
        expect(rev).not.to.equal(undefined)
        expect(rev?.content.title).to.equal(data.title)
        expect(rev?.content.path).to.equal('/new-page')
        expect(rev?.content.body).to.equal(data.body)
        expect(rev?.permissions?.read).to.equal(PermissionLevel.anyone)
        expect(rev?.permissions?.write).to.equal(PermissionLevel.anyone)
        expect(rev?.editor).to.equal(undefined)
      })
    })
  })

  describe('/pages/:pid', () => {
    const allow = 'OPTIONS, HEAD, GET, POST'
    const title = 'New Page'
    const body = 'This is a new page.'
    const anyone = { content: { title, body }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone } }
    const authenticated = { content: { title, body }, permissions: { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated } }
    const editor = { content: { title, body }, permissions: { read: PermissionLevel.editor, write: PermissionLevel.editor } }
    const admin = { content: { title, body }, permissions: { read: PermissionLevel.admin, write: PermissionLevel.admin } }

    describe('OPTIONS /pages/:pid', () => {
      let page: Page

      beforeEach(async () => {
        page = new Page({ revisions: [{ content: { title: 'New Page', body: 'This is a new page.' } }] })
        await page.save()
        res = await request(api).options(`${base}/pages/${page.id ?? ''}`)
      })

      it('returns correct status and headers', () => {
        expect(res.status).to.equal(204)
        expect(res.headers.allow).to.equal(allow)
        expect(res.headers['access-control-allow-methods']).to.equal(allow)
      })
    })

    describe('HEAD /pages/:pid', () => {
      describe('Anonymous calls', () => {
        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'HEAD', page)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'HEAD', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'HEAD', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'HEAD', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })
      })

      describe('Authenticated calls', () => {
        const user = new User({ name: 'Authenticated User' })
        let auth = { Authorization: '' }

        beforeEach(async () => {
          auth = await initUser(user)
        })

        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })
      })

      describe('Editor calls', () => {
        const user = new User({ name: 'Editor' })
        let auth = { Authorization: '' }

        beforeEach(async () => {
          auth = await initUser(user)
        })

        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, anyone, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, authenticated, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, editor, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, admin, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })
      })

      describe('Admin calls', () => {
        const user = new User({ name: 'Admin', admin: true })
        let auth = { Authorization: '' }

        beforeEach(async () => {
          auth = await initUser(user)
        })

        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })
      })
    })

    describe('GET /pages/:pid', () => {
      describe('Anonymous calls', () => {
        it('returns status and headers that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })
      })

      describe('Authenticated calls', () => {
        const user = new User({ name: 'Authenticated User' })
        let auth = { Authorization: '' }

        beforeEach(async () => {
          auth = await initUser(user)
        })

        it('returns status and headers that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })
      })

      describe('Editor calls', () => {
        const user = new User({ name: 'Editor' })
        let auth = { Authorization: '' }

        beforeEach(async () => {
          auth = await initUser(user)
        })

        it('returns status and headers that anyone can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, anyone, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content that anyone can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, anyone, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, authenticated, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only users can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, authenticated, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, editor, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only an editor can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, editor, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, admin, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only admins can read', async () => {
          const page = new Page({ revisions: [Object.assign({}, admin, { editor: user.getObj() })] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })
      })

      describe('Admin calls', () => {
        const user = new User({ name: 'Admin', admin: true })
        let auth = { Authorization: '' }

        beforeEach(async () => {
          auth = await initUser(user)
        })

        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content that anyone can read', async () => {
          const page = new Page({ revisions: [anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only users can read', async () => {
          const page = new Page({ revisions: [authenticated] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only editors can read', async () => {
          const page = new Page({ revisions: [editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only admins can read', async () => {
          const page = new Page({ revisions: [admin] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })
      })
    })

    describe('POST /pages/:pid', () => {
      const editor = new User()
      const admin = new User({ name: 'Admin', admin: true })
      let content: ContentData
      let permissions: PermissionsData
      let orig: RevisionData

      const title = 'New Revision'
      const body = 'This is the revised body.'
      const update = { title, body, msg: 'New revision' }

      before(async () => {
        await editor.save()
      })

      beforeEach(() => {
        content = { title: 'Original Revision', body: 'This is the original body.' }
        permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
        orig = { content, permissions, msg: 'Initial text' }
        orig.editor = editor.getObj()
      })

      describe('An anonymous user', () => {
        it('can update a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
        })

        it('won\'t update a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('won\'t update a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('won\'t update a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.revisions).to.have.lengthOf(1)
        })
      })

      describe('An authenticated user', () => {
        let user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          tokens = await user.generateTokens()
          await user.save()
        })

        it('can update a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId =after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(user.id?.toString())
        })

        it('can update a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(user.id?.toString())
        })

        it('can\'t update a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('can\'t update a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })
      })

      describe('An editor', () => {
        let tokens: TokenSet

        beforeEach(async () => {
          tokens = await editor.generateTokens()
          await editor.save()
        })

        it('can update a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId =after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can update a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can update a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can\'t update a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })
      })

      describe('An admin', () => {
        let tokens: TokenSet

        before(async () => {
          await admin.save()
        })

        beforeEach(async () => {
          tokens = await admin.generateTokens()
          await admin.save()
        })

        it('can update a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId =after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can update a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can update a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can update a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).post(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })
      })
    })
  })
})
