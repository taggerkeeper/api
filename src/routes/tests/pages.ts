import { expect } from 'chai'
import request from 'supertest'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import loadPageById from '../../models/page/loaders/by-id.js'
import getAPIInfo from '../../utils/get-api-info.js'
import { PermissionLevel } from '../../models/permissions/data.js'
import Revision from '../../models/revision/revision.js'
import Page from '../../models/page/page.js'
import PageData from '../../models/page/data.js'
import PageModel from '../../models/page/model.js'
import RevisionData from '../../models/revision/data.js'
import User from '../../models/user/user.js'
import api from '../../server.js'

import getTokens from './initializers/get-tokens.js'
import doesDiff from './expecters/does-diff.js'

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

  await Promise.all(pages.map(async page => await page.save()))
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
  const auth = { Authorization: 'Bearer none' }
  const admin = new User({ name: 'Admin', admin: true })
  const editor = new User()
  const title = 'New Page'
  const body = 'This is a new page.'
  const revisions: { [key: string]: RevisionData } = {
    anyone: { content: { title, body }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone } },
    auth: { content: { title, body }, permissions: { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated } },
    editor: { content: { title, body }, permissions: { read: PermissionLevel.editor, write: PermissionLevel.editor } },
    admin: { content: { title, body }, permissions: { read: PermissionLevel.admin, write: PermissionLevel.admin } },
    authWrite: { content: { title, body }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.authenticated } },
    editorWrite: { content: { title, body }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.editor } },
    adminWrite: { content: { title, body }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.admin } },
    anyoneUpdate: { content: { title: 'Updated Page', body: 'This is an update' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone } },
    authUpdate: { content: { title: 'Updated Page', body: 'This is an update' }, permissions: { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated } },
    editorUpdate: { content: { title: 'Updated Page', body: 'This is an update' }, permissions: { read: PermissionLevel.editor, write: PermissionLevel.editor } },
    adminUpdate: { content: { title: 'Updated Page', body: 'This is an update' }, permissions: { read: PermissionLevel.admin, write: PermissionLevel.admin } }
  }

  before(async () => {
    await editor.save()
    for (const key of Object.keys(revisions)) {
      revisions[key].editor = editor.getObj()
    }
  })

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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set(auth)
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
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set(auth)
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set(auth)
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
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set(auth)
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set(auth)
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
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set(auth)
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
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
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
          expect(res.body.total).to.equal(11)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('ignores the trashed element (headers & status)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
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
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
          expect(res.body.total).to.equal(11)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Editor calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
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
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
          expect(res.body.total).to.equal(12)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('ignores the trashed element (headers & status)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
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
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
          expect(res.body.total).to.equal(12)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
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
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
          expect(res.body.total).to.equal(13)
          expect(res.body.start).to.equal(4)
          expect(res.body.end).to.equal(5)
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('returns correct status and headers for a trashed query', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
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
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
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

    describe('DELETE /pages', () => {
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).delete(`${base}/pages`).set(auth)
          expect(res.status).to.equal(403)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('doesn\'t delete trashed pages', async () => {
          res = await request(api).delete(`${base}/pages`).set(auth)
          const check = await PageModel.countDocuments({})
          expect(check).to.equal(total)
        })
      })

      describe('Editor calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).delete(`${base}/pages`).set(auth)
          expect(res.status).to.equal(403)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('doesn\'t delete trashed pages', async () => {
          res = await request(api).delete(`${base}/pages`).set(auth)
          const check = await PageModel.countDocuments({})
          expect(check).to.equal(total)
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).delete(`${base}/pages`).set(auth)
          expect(res.status).to.equal(204)
          expect(res.headers.allow).to.equal(allow)
          expect(res.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('deletes trashed pages', async () => {
          res = await request(api).delete(`${base}/pages`).set(auth)
          const check = await PageModel.countDocuments({})
          expect(check).to.equal(0)
        })
      })
    })
  })

  describe('/pages/:pid', () => {
    const allow = 'OPTIONS, HEAD, GET, PUT, DELETE'

    describe('OPTIONS /pages/:pid', () => {
      let page: Page

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
            page = new Page({ revisions: [revisions.anyone] })
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
            page = new Page({ revisions: [revisions.auth] })
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
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
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
            page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}`).set(auth)
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
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'HEAD', page)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'HEAD', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'HEAD', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'HEAD', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
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
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
          const { id, path } = await testPageLoad(base, 'GET', page)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('returns status and headers that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.message).to.equal('Page not found.')
          expect(path.body.message).to.equal('Page not found.')
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns status and headers that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only an editor can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(404)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(404)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns an error message when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns status and headers for a page that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content that anyone can read', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only users can read', async () => {
          const page = new Page({ revisions: [revisions.auth] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only editors can read', async () => {
          const page = new Page({ revisions: [revisions.editor] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.body.revisions[0].content.title).to.equal(title)
          expect(id.body.revisions[0].content.body).to.equal(body)

          expect(path.body.revisions[0].content.title).to.equal(title)
          expect(path.body.revisions[0].content.body).to.equal(body)
        })

        it('returns status and headers when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
          const { id, path } = await testPageLoad(base, 'GET', page, auth)

          expect(id.status).to.equal(200)
          expect(id.headers.allow).to.equal(allow)
          expect(id.headers['access-control-allow-methods']).to.equal(allow)

          expect(path.status).to.equal(200)
          expect(path.headers.allow).to.equal(allow)
          expect(path.headers['access-control-allow-methods']).to.equal(allow)
        })

        it('returns content when only admins can read', async () => {
          const page = new Page({ revisions: [revisions.admin] })
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
      const title = 'New Revision'
      const body = 'This is the revised body.'
      const permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      const update = { title, body, permissions, msg: 'New revision' }

      describe('An anonymous user', () => {
        it('can update a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
        })

        it('won\'t update a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('won\'t update a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('won\'t update a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
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

        beforeEach(async () => {
          const { access } = await getTokens({ user })
          auth.Authorization = `Bearer ${access}`
        })

        it('can update a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(user.id?.toString())
        })

        it('can update a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(user.id?.toString())
        })

        it('can\'t update a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('can\'t update a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set(auth).send(update)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('An editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('can update a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can update a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can update a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can\'t update a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set(auth).send(update)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('An admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('can update a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can untrash a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone], trashed: new Date() })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can untrash a page only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite], trashed: new Date() })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can untrash a page only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite], trashed: new Date() })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          expect(res.status).to.equal(200)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can untrash a page only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite], trashed: new Date() })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).put(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.equal(undefined)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set(auth).send(update)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })
    })

    describe('DELETE /pages/:pid', () => {
      describe('An anonymous user', () => {
        it('can delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(401)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('can delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('An editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('can delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(403)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
          expect(res.body.path).to.equal(path)
          expect(res.body.message).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
        })
      })

      describe('An admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('can delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page anyone can edit', async () => {
          const page = new Page({ revisions: [revisions.anyone] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.equal(null)
        })

        it('can delete a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only users can edit', async () => {
          const page = new Page({ revisions: [revisions.authWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.equal(null)
        })

        it('can delete a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only editors can edit', async () => {
          const page = new Page({ revisions: [revisions.editorWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.equal(null)
        })

        it('can delete a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only admins can edit', async () => {
          const page = new Page({ revisions: [revisions.adminWrite] })
          await page.save()
          const pid = page.id ?? ''
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          expect(res.status).to.equal(200)
          expect(after).to.equal(null)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set(auth)
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
            page = new Page({ revisions: [revisions.anyone] })
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
            page = new Page({ revisions: [revisions.auth] })
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
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
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
            page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.anyone] })
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
            page = new Page({ revisions: [revisions.auth] })
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
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
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
            page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            expect(res.status).to.equal(200)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).head(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.anyone] })
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
            page = new Page({ revisions: [revisions.auth] })
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
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
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
            page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).get(`${base}/pages/${page.id ?? ''}/revisions`).set(auth)
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
            page = new Page({ revisions: [revisions.anyone] })
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
            page = new Page({ revisions: [revisions.auth] })
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
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
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
            page = new Page({ revisions: [revisions.admin] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            expect(res.status).to.equal(404)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })
      })

      describe('Admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions/1`).set(auth)
          })

          it('returns 400 and correct headers', () => {
            expect(res.status).to.equal(400)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.anyone] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.auth] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editor] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            expect(res.status).to.equal(204)
            expect(res.headers.allow).to.equal(allow)
            expect(res.headers['access-control-allow-methods']).to.equal(allow)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.admin] })
            await page.save()
            res = await request(api).options(`${base}/pages/${page.id ?? ''}/revisions/1`).set(auth)
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.authUpdate, revisions.anyone] })
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
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editorUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminUpdate, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.authUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.editorUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminUpdate, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.authUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.editorUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminUpdate, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.authUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.editorUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.anyoneUpdate))
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.authUpdate, revisions.anyone] })
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
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editorUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminUpdate, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.anyoneUpdate))
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.authUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.authUpdate))
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editorUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminUpdate, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.anyoneUpdate))
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.authUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.authUpdate))
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editorUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.editorUpdate))
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.adminUpdate, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.anyoneUpdate))
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.authUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.authUpdate))
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.editorUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.editorUpdate))
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            page = new Page({ revisions: [revisions.adminUpdate, revisions.anyone] })
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
              expect(res.body.content.title).to.equal(revisions.anyone.content.title)
              expect(res.body.content.path).to.equal('/new-page')
              expect(res.body.content.body).to.equal(revisions.anyone.content.body)
              expect(res.body.permissions.read).not.to.equal(undefined)
              expect(res.body.permissions.write).not.to.equal(undefined)
              expect(res.body.permissions.read).to.equal(revisions.anyone.permissions?.read)
              expect(res.body.permissions.write).to.equal(revisions.anyone.permissions?.write)
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
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.adminUpdate))
            })
          })
        })
      })
    })

    describe('PUT /pages/:pid/revisions/:revision', () => {
      let page: Page

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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.authWrite, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.editorWrite, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminWrite, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.authWrite, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.editorWrite, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminWrite, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.authWrite, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.editorWrite, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminWrite, revisions.anyone] })
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
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
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
            page = new Page({ revisions: [revisions.anyoneUpdate, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.authWrite, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.editorWrite, revisions.anyone] })
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
            page = new Page({ revisions: [revisions.adminWrite, revisions.anyone] })
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
