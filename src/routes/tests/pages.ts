import { expect } from 'chai'
import request from 'supertest'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import loadPageById from '../../models/page/loaders/by-id.js'
import getAPIInfo from '../../utils/get-api-info.js'
import ContentData from '../../models/content/data.js'
import PermissionsData, { PermissionLevel } from '../../models/permissions/data.js'
import Page from '../../models/page/page.js'
import PageData from '../../models/page/data.js'
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

const createTestSearchPages = async (editor: User): Promise<void> => {
  const pages = []
  for (let i = 1; i <= 15; i++) {
    const data: PageData = { revisions: [{ content: { title: `Test Page #${i}`, path: `/test-${i}`, body: 'This is a test page.' } }] }
    if (i > 10) data.trashed = new Date()
    pages.push(new Page(data))
  }

  pages.push(new Page({ revisions: [{ content: { title: 'Authenticated Only', path: '/auth', body: 'Authenticated only.' }, permissions: { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated } }] }))
  pages.push(new Page({ revisions: [{ content: { title: 'Editor Only', path: '/editor', body: 'Editor only.' }, permissions: { read: PermissionLevel.editor, write: PermissionLevel.editor }, editor: editor.getObj() }] }))
  pages.push(new Page({ revisions: [{ content: { title: 'Admin Only', path: '/admin', body: 'Admin only.' }, permissions: { read: PermissionLevel.admin, write: PermissionLevel.admin } }] }))

  await Promise.all(pages.map(page => page.save()))
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
    const allow = 'OPTIONS, HEAD, GET, POST, DELETE'
    const editor = new User()

    before(async () => {
      await editor.save()
    })

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
      const query = 'created-after=0&offset=4&limit=2'

      beforeEach(async () => {
        await createTestSearchPages(editor)
      })

      describe('Anonymous calls', () => {
        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`)
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('10')
        })

        it('ignores the trashed element', async () => {
          res = await request(api).head(`${base}/pages?${query}&trashed=true`)
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('10')
        })
      })

      describe('Authenticated calls', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          tokens = await user.generateTokens()
          await user.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('11')
        })

        it('ignores the trashed element', async () => {
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('11')
        })
      })

      describe('Editor calls', () => {
        let tokens: TokenSet

        beforeEach(async () => {
          tokens = await editor.generateTokens()
          await editor.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('12')
        })

        it('ignores the trashed element', async () => {
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('12')
        })
      })

      describe('Admin calls', () => {
        const admin = new User({ name: 'Admin', admin: true })
        let tokens: TokenSet

        before(async () => {
          await admin.save()
        })

        beforeEach(async () => {
          tokens = await admin.generateTokens()
          await admin.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('13')
        })

        it('returns correct status and headers for trashed query', async () => {
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).not.to.include('next')
          expect(rels).not.to.include('last')
          expect(rels).to.have.lengthOf(2)
          expect(res.headers['x-total-count']).to.equal('5')
        })
      })
    })

    describe('GET /pages', () => {
      const query = 'created-after=0&offset=4&limit=2'

      beforeEach(async () => {
        await createTestSearchPages(editor)
      })

      describe('Anonymous calls', () => {
        it('returns correct status and headers', async () => {
          res = await request(api).get(`${base}/pages?${query}`)
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(200)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('10')
        })

        it('returns your results', async () => {
          res = await request(api).get(`${base}/pages?${query}`)
          expect(res.body.total).to.equal(10)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('ignores the trashed element (headers & status)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`)
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(200)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('10')
        })

        it('ignores the trashed element (body)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`)
          expect(res.body.total).to.equal(10)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Authenticated calls', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          tokens = await user.generateTokens()
          await user.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(200)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('11')
        })

        it('returns your results', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.body.total).to.equal(11)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('ignores the trashed element (headers & status)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(200)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('11')
        })

        it('ignores the trashed element (body)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.body.total).to.equal(11)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Editor calls', () => {
        let tokens: TokenSet

        beforeEach(async () => {
          tokens = await editor.generateTokens()
          await editor.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(200)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('12')
        })

        it('returns your results', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.body.total).to.equal(12)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('ignores the trashed element (headers & status)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(200)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('12')
        })

        it('ignores the trashed element (body)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.body.total).to.equal(12)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Admin calls', () => {
        const admin = new User({ name: 'Admin', admin: true })
        let tokens: TokenSet

        before(async () => {
          await admin.save()
        })

        beforeEach(async () => {
          tokens = await admin.generateTokens()
          await admin.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(200)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).to.include('next')
          expect(rels).to.include('last')
          expect(rels).to.have.lengthOf(4)
          expect(res.headers['x-total-count']).to.equal('13')
        })

        it('returns your results', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.body.total).to.equal(13)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('returns correct status and headers for a trashed query', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const rels = Object.keys(parseLinks(res.headers.link))
          expect(res.status).to.equal(200)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
          expect(rels).to.include('first')
          expect(rels).to.include('previous')
          expect(rels).not.to.include('next')
          expect(rels).not.to.include('last')
          expect(rels).to.have.lengthOf(2)
          expect(res.headers['x-total-count']).to.equal('5')
        })

        it('returns your results for a trashed query', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.body.total).to.equal(5)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(1)
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

    describe('DELETED /pages', () => {
      const total = 3

      beforeEach(async () => {
        for (let i = 1; i <= total; i++) {
          const page = new Page({ revisions: [{ content: { title: `Page ${i}`, body: 'Hello, world!' } }], trashed: new Date() })
          await page.save()
        }
      })

      describe('Anonymous calls', () => {
        it('returns correct status and headers', async () => {
          res = await request(api).delete(`${base}/pages`)
          expect(res.status).to.equal(400)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('doesn\'t delete trashed pages', async () => {
          res = await request(api).delete(`${base}/pages`)
          const check = await PageModel.countDocuments({})
          expect(check).to.equal(total)
        })
      })

      describe('Authenticated calls', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          tokens = await user.generateTokens()
          await user.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).delete(`${base}/pages`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.status).to.equal(403)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('doesn\'t delete trashed pages', async () => {
          res = await request(api).delete(`${base}/pages`).set({ Authorization: `Bearer ${tokens.access}` })
          const check = await PageModel.countDocuments({})
          expect(check).to.equal(total)
        })
      })

      describe('Editor calls', () => {
        let tokens: TokenSet

        beforeEach(async () => {
          tokens = await editor.generateTokens()
          await editor.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).delete(`${base}/pages`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.status).to.equal(403)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('doesn\'t delete trashed pages', async () => {
          res = await request(api).delete(`${base}/pages`).set({ Authorization: `Bearer ${tokens.access}` })
          const check = await PageModel.countDocuments({})
          expect(check).to.equal(total)
        })
      })

      describe('Admin calls', () => {
        const admin = new User({ name: 'Admin', admin: true })
        let tokens: TokenSet

        before(async () => {
          await admin.save()
        })

        beforeEach(async () => {
          tokens = await admin.generateTokens()
          await admin.save()
        })

        it('returns correct status and headers', async () => {
          res = await request(api).delete(`${base}/pages`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('deletes trashed pages', async () => {
          res = await request(api).delete(`${base}/pages`).set({ Authorization: `Bearer ${tokens.access}` })
          const check = await PageModel.countDocuments({})
          expect(check).to.equal(0)
        })
      })
    })
  })

  describe('/pages/:pid', () => {
    const allow = 'OPTIONS, HEAD, GET, PUT, DELETE'
    const title = 'New Page'
    const body = 'This is a new page.'
    const anyone = { content: { title, body }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone } }
    const authenticated = { content: { title, body }, permissions: { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated } }
    const editor = { content: { title, body }, permissions: { read: PermissionLevel.editor, write: PermissionLevel.editor } }
    const admin = { content: { title, body }, permissions: { read: PermissionLevel.admin, write: PermissionLevel.admin } }

    describe('OPTIONS /pages/:pid', () => {
      let page: Page
      const content = { title: 'New Page', body: 'This is a new page.' }
      const permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      const orig: RevisionData = { content, permissions }

      beforeEach(() => {
        permissions.read = PermissionLevel.anyone
        permissions.write = PermissionLevel.anyone
      })

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login`)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Authenticated user', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Editor', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Admin', () => {
        const user = new User({ name: 'Admin', admin: true })
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
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

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).head(`${base}/pages${path}`)
          expect(res.status).to.equal(400)
        })
      })

      describe('Authenticated calls', () => {
        const user = new User({ name: 'Authenticated User' })
        const auth = { Authorization: '' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const { access } = await user.generateTokens()
          await user.save()
          auth.Authorization = `Bearer ${access}`
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

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).head(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
        })
      })

      describe('Editor calls', () => {
        const user = new User({ name: 'Editor' })
        const auth = { Authorization: '' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const { access } = await user.generateTokens()
          await user.save()
          auth.Authorization = `Bearer ${access}`
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

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).head(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
        })
      })

      describe('Admin calls', () => {
        const user = new User({ name: 'Admin', admin: true })
        const auth = { Authorization: '' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const { access } = await user.generateTokens()
          await user.save()
          auth.Authorization = `Bearer ${access}`
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

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).head(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
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

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).get(`${base}/pages${path}`)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('Authenticated calls', () => {
        const user = new User({ name: 'Authenticated User' })
        const auth = { Authorization: '' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const { access } = await user.generateTokens()
          await user.save()
          auth.Authorization = `Bearer ${access}`
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

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).get(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('Editor calls', () => {
        const user = new User({ name: 'Editor' })
        const auth = { Authorization: '' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const { access } = await user.generateTokens()
          await user.save()
          auth.Authorization = `Bearer ${access}`
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

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).get(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('Admin calls', () => {
        const user = new User({ name: 'Admin', admin: true })
        const auth = { Authorization: '' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const { access } = await user.generateTokens()
          await user.save()
          auth.Authorization = `Bearer ${access}`
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

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).get(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })
    })

    describe('PUT /pages/:pid', () => {
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
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
        })

        it('won\'t update a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('won\'t update a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('won\'t update a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).send(update)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('An authenticated user', () => {
        const user = new User()
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
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(user.id?.toString())
        })

        it('can update a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
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
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('can\'t update a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
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
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can update a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
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
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
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
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
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
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can untrash a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig], trashed: new Date() })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can untrash a page only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig], trashed: new Date() })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can untrash a page only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig], trashed: new Date() })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can untrash a page only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig], trashed: new Date() })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.equal(undefined)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set({ Authorization: `Bearer ${tokens.access}` }).send(update)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })
    })

    describe('DELETE /pages/:pid', () => {
      const editor = new User()
      const admin = new User({ name: 'Admin', admin: true })
      let content: ContentData
      let permissions: PermissionsData
      let orig: RevisionData

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
        it('can delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('An authenticated user', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          tokens = await user.generateTokens()
          await user.save()
        })

        it('can delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('An editor', () => {
        let tokens: TokenSet

        beforeEach(async () => {
          tokens = await editor.generateTokens()
          await editor.save()
        })

        it('can delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
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

        it('can delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.equal(null)
        })

        it('can delete a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only users can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.authenticated
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.equal(null)
        })

        it('can delete a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only editors can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.editor
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.equal(null)
        })

        it('can delete a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only admins can edit', async () => {
          if (orig.permissions !== undefined) orig.permissions.write = PermissionLevel.admin
          const page = new Page({ revisions: [orig] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set({ Authorization: `Bearer ${tokens.access}` })
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.equal(null)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set({ Authorization: `Bearer ${tokens.access}` })
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })
    })
  })

  describe('/pages/:pid/revisions', () => {
    const allow = 'OPTIONS, HEAD, GET'

    describe('OPTIONS /pages/:pid/revisions', () => {
      let page: Page
      const content = { title: 'New Page', body: 'This is a new page.' }
      const permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      const orig: RevisionData = { content, permissions }

      beforeEach(() => {
        permissions.read = PermissionLevel.anyone
        permissions.write = PermissionLevel.anyone
      })

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions`)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Authenticated user', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Editor', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Admin', () => {
        const user = new User({ name: 'Admin', admin: true })
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })
    })

    describe('HEAD /pages/:pid/revisions', () => {
      let page: Page
      const content = { title: 'New Page', body: 'This is a new page.' }
      const permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      const orig: RevisionData = { content, permissions }

      beforeEach(() => {
        permissions.read = PermissionLevel.anyone
        permissions.write = PermissionLevel.anyone
      })

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions`)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Authenticated user', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Editor', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Admin', () => {
        const user = new User({ name: 'Admin', admin: true })
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })
    })

    describe('GET /pages/:pid/revisions', () => {
      let page: Page
      const content = { title: 'New Page', body: 'This is a new page.' }
      const permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      const orig: RevisionData = { content, permissions }

      beforeEach(() => {
        permissions.read = PermissionLevel.anyone
        permissions.write = PermissionLevel.anyone
      })

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions`)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('Page not found.')
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('Page not found.')
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('Page not found.')
          })
        })
      })

      describe('Authenticated user', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('Page not found.')
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('Page not found.')
          })
        })
      })

      describe('Editor', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('Page not found.')
          })
        })
      })

      describe('Admin', () => {
        const user = new User({ name: 'Admin', admin: true })
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/login/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the page\'s revisions', () => {
            expect(Array.isArray(res.body)).to.equal(true)
            expect(res.body).to.have.lengthOf(1)
            expect(res.body[0].content.title).to.equal('New Page')
            expect(res.body[0].content.path).to.equal('/new-page')
            expect(res.body[0].content.body).to.equal('This is a new page.')
          })
        })
      })
    })
  })

  describe('/pages/:pid/revisions/:revision', () => {
    const allow = 'OPTIONS, HEAD, GET, PUT'

    describe('OPTIONS /pages/:pid/revisions/:revision', () => {
      let page: Page
      const content = { title: 'New Page', body: 'This is a new page.' }
      const permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      const orig: RevisionData = { content, permissions }

      beforeEach(() => {
        permissions.read = PermissionLevel.anyone
        permissions.write = PermissionLevel.anyone
      })

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions/1`)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Authenticated user', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Editor', () => {
        const user = new User()
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            orig.editor = user.getObj()
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Admin', () => {
        const user = new User({ name: 'Admin', admin: true })
        let tokens: TokenSet

        before(async () => {
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/login/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.authenticated
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            orig.editor = editor.getObj()
            permissions.read = PermissionLevel.editor
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            permissions.read = PermissionLevel.admin
            page = new Page({ revisions: [orig] })
            await page.save()
            tokens = await user.generateTokens()
            await user.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set({ Authorization: `Bearer ${tokens.access}` })
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })
    })

    describe('HEAD /pages/:pid/revisions/:revision', () => {
      let page: Page
      const orig: RevisionData = {
        content: { title: 'Version 1', body: 'This is the original text.' },
        permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      }
      const update: RevisionData = {
        content: { title: 'Version 2', body: 'This is an update.' },
        permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      }

      beforeEach(() => {
        update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      })

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions/1`)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.editor, write: PermissionLevel.editor }
            update.editor = editor.getObj()
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.admin, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })
      })

      describe('Authenticated user', () => {
        const user = new User()
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const tokens = await user.generateTokens()
          auth.Authorization = `Bearer ${tokens.access}`
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.editor, write: PermissionLevel.editor }
            update.editor = editor.getObj()
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.admin, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })
      })

      describe('An editor', () => {
        const user = new User()
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          update.editor = user.getObj()
          const tokens = await user.generateTokens()
          auth.Authorization = `Bearer ${tokens.access}`
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.editor, write: PermissionLevel.editor }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.admin, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })
      })

      describe('An admin', () => {
        const user = new User({ name: 'Admin', admin: true })
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const tokens = await user.generateTokens()
          auth.Authorization = `Bearer ${tokens.access}`
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.editor, write: PermissionLevel.editor }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.admin, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })
          })
        })
      })
    })

    describe('GET /pages/:pid/revisions/:revision', () => {
      let page: Page
      const orig: RevisionData = {
        content: { title: 'Version 1', body: 'This is the original text.' },
        permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      }
      const update: RevisionData = {
        content: { title: 'Version 2', body: 'This is an update.' },
        permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      }

      beforeEach(() => {
        update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      })

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions/1`)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(1)
              expect(read[0].value).to.equal('anyone')

              expect(write).to.have.lengthOf(1)
              expect(write[0].value).to.equal('anyone')
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.editor, write: PermissionLevel.editor }
            update.editor = editor.getObj()
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.admin, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })
      })

      describe('Authenticated user', () => {
        const user = new User()
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const tokens = await user.generateTokens()
          auth.Authorization = `Bearer ${tokens.access}`
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(1)
              expect(read[0].value).to.equal('anyone')

              expect(write).to.have.lengthOf(1)
              expect(write[0].value).to.equal('anyone')
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(2)
              expect(read[0].removed).to.equal(true)
              expect(read[0].value).to.equal('anyone')
              expect(read[1].added).to.equal(true)
              expect(read[1].value).to.equal('authenticated')

              expect(write).to.have.lengthOf(2)
              expect(write[0].removed).to.equal(true)
              expect(write[0].value).to.equal('anyone')
              expect(write[1].added).to.equal(true)
              expect(write[1].value).to.equal('authenticated')
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          const editor = new User()

          before(async () => {
            await editor.save()
          })

          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.editor, write: PermissionLevel.editor }
            update.editor = editor.getObj()
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.admin, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })
      })

      describe('An editor', () => {
        const user = new User()
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          update.editor = user.getObj()
          const tokens = await user.generateTokens()
          auth.Authorization = `Bearer ${tokens.access}`
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(1)
              expect(read[0].value).to.equal('anyone')

              expect(write).to.have.lengthOf(1)
              expect(write[0].value).to.equal('anyone')
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(2)
              expect(read[0].removed).to.equal(true)
              expect(read[0].value).to.equal('anyone')
              expect(read[1].added).to.equal(true)
              expect(read[1].value).to.equal('authenticated')

              expect(write).to.have.lengthOf(2)
              expect(write[0].removed).to.equal(true)
              expect(write[0].value).to.equal('anyone')
              expect(write[1].added).to.equal(true)
              expect(write[1].value).to.equal('authenticated')
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.editor, write: PermissionLevel.editor }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(2)
              expect(read[0].removed).to.equal(true)
              expect(read[0].value).to.equal('anyone')
              expect(read[1].added).to.equal(true)
              expect(read[1].value).to.equal('editor')

              expect(write).to.have.lengthOf(2)
              expect(write[0].removed).to.equal(true)
              expect(write[0].value).to.equal('anyone')
              expect(write[1].added).to.equal(true)
              expect(write[1].value).to.equal('editor')
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.admin, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              expect(res.status).to.equal(404)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })
      })

      describe('An admin', () => {
        const user = new User({ name: 'Admin', admin: true })
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const tokens = await user.generateTokens()
          auth.Authorization = `Bearer ${tokens.access}`
          await user.save()
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(1)
              expect(read[0].value).to.equal('anyone')

              expect(write).to.have.lengthOf(1)
              expect(write[0].value).to.equal('anyone')
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(2)
              expect(read[0].removed).to.equal(true)
              expect(read[0].value).to.equal('anyone')
              expect(read[1].added).to.equal(true)
              expect(read[1].value).to.equal('authenticated')

              expect(write).to.have.lengthOf(2)
              expect(write[0].removed).to.equal(true)
              expect(write[0].value).to.equal('anyone')
              expect(write[1].added).to.equal(true)
              expect(write[1].value).to.equal('authenticated')
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.editor, write: PermissionLevel.editor }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(2)
              expect(read[0].removed).to.equal(true)
              expect(read[0].value).to.equal('anyone')
              expect(read[1].added).to.equal(true)
              expect(read[1].value).to.equal('editor')

              expect(write).to.have.lengthOf(2)
              expect(write[0].removed).to.equal(true)
              expect(write[0].value).to.equal('anyone')
              expect(write[1].added).to.equal(true)
              expect(write[1].value).to.equal('editor')
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.admin, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              expect(res.status).to.equal(400)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns an error', () => {
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the revision requested', () => {
              expect(res.body.content.title).to.equal(orig.content.title)
              expect(res.body.content.path).to.equal('/version-1')
              expect(res.body.content.body).to.equal(orig.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(orig.permissions?.read)
              expect(res.body.permissions.write).to.equal(orig.permissions?.write)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              expect(res.status).to.equal(200)
              expect(res.headers.allow).to.equal(allow)
              expect(res.headers['access-control-allow-methods']).to.equal(allow)
            })

            it('returns the difference', () => {
              const { title, path, body } = res.body.content
              const { read, write } = res.body.permissions

              expect(title).to.have.lengthOf(3)
              expect(title[0].value).to.equal('Version ')
              expect(title[1].removed).to.equal(true)
              expect(title[1].value).to.equal('1')
              expect(title[2].added).to.equal(true)
              expect(title[2].value).to.equal('2')

              expect(path).to.have.lengthOf(3)
              expect(path[0].value).to.equal('/version-')
              expect(path[1].removed).to.equal(true)
              expect(path[1].value).to.equal('1')
              expect(path[2].added).to.equal(true)
              expect(path[2].value).to.equal('2')

              expect(body).to.have.lengthOf(7)
              expect(body[0].value).to.equal('This is ')
              expect(body[1].removed).to.equal(true)
              expect(body[1].value).to.equal('the')
              expect(body[2].added).to.equal(true)
              expect(body[2].value).to.equal('an')
              expect(body[3].value).to.equal(' ')
              expect(body[4].removed).to.equal(true)
              expect(body[4].value).to.equal('original text')
              expect(body[5].added).to.equal(true)
              expect(body[5].value).to.equal('update')
              expect(body[6].value).to.equal('.')

              expect(read).to.have.lengthOf(2)
              expect(read[0].removed).to.equal(true)
              expect(read[0].value).to.equal('anyone')
              expect(read[1].added).to.equal(true)
              expect(read[1].value).to.equal('admin')

              expect(write).to.have.lengthOf(2)
              expect(write[0].removed).to.equal(true)
              expect(write[0].value).to.equal('anyone')
              expect(write[1].added).to.equal(true)
              expect(write[1].value).to.equal('admin')
            })
          })
        })
      })
    })

    describe('PUT /pages/:pid/revisions/:revision', () => {
      let page: Page
      const orig: RevisionData = {
        content: { title: 'Version 1', body: 'This is the original text.' },
        permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      }
      const update: RevisionData = {
        content: { title: 'Version 2', body: 'This is an update.' },
        permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      }

      beforeEach(() => {
        update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      })

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).put(`${base}/pages/login/revisions/1`)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('rolling back a page anyone can edit', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only users can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`)
          })

          it('returns 401 and correct headers', () => {
            expect(res.status).to.equal(401)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
            expect(res.headers['www-authenticate']).to.equal('Bearer error="invalid_token" error_description="The access token could not be verified."')
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('This method requires authentication.')
          })
        })

        describe('rolling back a page only editors can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.editor }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`)
          })

          it('returns 401 and correct headers', () => {
            expect(res.status).to.equal(401)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
            expect(res.headers['www-authenticate']).to.equal('Bearer error="invalid_token" error_description="The access token could not be verified."')
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('This method requires authentication.')
          })
        })

        describe('rolling back a page only admins can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`)
          })

          it('returns 401 and correct headers', () => {
            expect(res.status).to.equal(401)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
            expect(res.headers['www-authenticate']).to.equal('Bearer error="invalid_token" error_description="The access token could not be verified."')
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('This method requires authentication.')
          })
        })
      })

      describe('Authenticated user', () => {
        const user = new User()
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const tokens = await user.generateTokens()
          await user.save()
          auth.Authorization = `Bearer ${tokens.access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).put(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('rolling back a page anyone can edit', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only users can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only editors can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.editor }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 403 and correct headers', () => {
            expect(res.status).to.equal(403)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('You do not have permission to update this page.')
          })
        })

        describe('rolling back a page only admins can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 403 and correct headers', () => {
            expect(res.status).to.equal(403)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('You do not have permission to update this page.')
          })
        })
      })

      describe('Editor', () => {
        const user = new User()
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await user.save()
        })

        beforeEach(async () => {
          const tokens = await user.generateTokens()
          await user.save()
          auth.Authorization = `Bearer ${tokens.access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).put(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('rolling back a page anyone can edit', () => {
          beforeEach(async () => {
            update.editor = user.getObj()
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only users can edit', () => {
          beforeEach(async () => {
            update.editor = user.getObj()
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only editors can edit', () => {
          beforeEach(async () => {
            update.editor = user.getObj()
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.editor }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only admins can edit', () => {
          beforeEach(async () => {
            update.editor = user.getObj()
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 403 and correct headers', () => {
            expect(res.status).to.equal(403)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('You do not have permission to update this page.')
          })
        })
      })

      describe('Admin', () => {
        const admin = new User({ name: 'Admin', admin: true })
        const auth = { Authorization: 'Bearer empty' }

        before(async () => {
          await admin.save()
        })

        beforeEach(async () => {
          const tokens = await admin.generateTokens()
          await admin.save()
          auth.Authorization = `Bearer ${tokens.access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).put(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns an error', () => {
            expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
            expect(res.body.path).to.equal('/login')
          })
        })

        describe('rolling back a page anyone can edit', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only users can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.authenticated }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only editors can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.editor }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only admins can edit', () => {
          beforeEach(async () => {
            update.permissions = { read: PermissionLevel.anyone, write: PermissionLevel.admin }
            page = new Page({ revisions: [update, orig] })
            await page.save()
            res = await request(api).put(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })

          it('returns the updated page', () => {
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })
      })
    })
  })
})
