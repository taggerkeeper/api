import { dirname } from 'path'
import { fileURLToPath } from 'url'
import chai, { expect } from 'chai'
import chaiSubset from 'chai-subset'
import request from 'supertest'
import loadPackage, { NPMPackage } from '../../utils/load-package.js'
import loadPageById from '../../models/page/loaders/by-id.js'
import getAPIInfo from '../../utils/get-api-info.js'
import isPopulatedArray from '../../utils/is-populated-array.js'
import { PermissionLevel } from '../../models/permissions/data.js'
import Revision from '../../models/revision/revision.js'
import Page from '../../models/page/page.js'
import PageModel from '../../models/page/model.js'
import RevisionData from '../../models/revision/data.js'
import User from '../../models/user/user.js'
import api from '../../server.js'

import createTestPage from './initializers/create-test-page.js'
import createTestSearchPages from './initializers/create-test-search-pages.js'
import getTokens from './initializers/get-tokens.js'
import hasStatusAndHeaders from './expecters/has-status-and-headers.js'
import hasLinkHeader from './expecters/has-link-header.js'
import isPage from './expecters/is-page.js'
import doesDiff from './expecters/does-diff.js'

const dir = dirname(fileURLToPath(import.meta.url))

chai.use(chaiSubset)

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
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    before(async () => {
      await editor.save()
    })

    describe('OPTIONS /pages', () => {
      beforeEach(async () => {
        res = await request(api).options(`${base}/pages`)
      })

      it('returns correct status and headers', () => {
        hasStatusAndHeaders(res, 204, headers)
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
          hasStatusAndHeaders(res, 204, Object.assign({}, headers, { 'x-total-count': '10' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('ignores the trashed element', async () => {
          res = await request(api).head(`${base}/pages?${query}&trashed=true`)
          hasStatusAndHeaders(res, 204, Object.assign({}, headers, { 'x-total-count': '10' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })
      })

      describe('Authenticated calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set(auth)
          hasStatusAndHeaders(res, 204, Object.assign({}, headers, { 'x-total-count': '11' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('ignores the trashed element', async () => {
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set(auth)
          hasStatusAndHeaders(res, 204, Object.assign({}, headers, { 'x-total-count': '11' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })
      })

      describe('Editor calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set(auth)
          hasStatusAndHeaders(res, 204, Object.assign({}, headers, { 'x-total-count': '12' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('ignores the trashed element', async () => {
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set(auth)
          hasStatusAndHeaders(res, 204, Object.assign({}, headers, { 'x-total-count': '12' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })
      })

      describe('Admin calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).head(`${base}/pages?${query}`).set(auth)
          hasStatusAndHeaders(res, 204, Object.assign({}, headers, { 'x-total-count': '13' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('returns correct status and headers for trashed query', async () => {
          res = await request(api).head(`${base}/pages?${query}&trashed=true`).set(auth)
          hasStatusAndHeaders(res, 204, Object.assign({}, headers, { 'x-total-count': '5' }))
          hasLinkHeader(res, ['first', 'previous'])
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
          hasStatusAndHeaders(res, 200, Object.assign({}, headers, { 'x-total-count': '10' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('returns your results', async () => {
          res = await request(api).get(`${base}/pages?${query}`)
          expect(res.body).to.containSubset({ total: 10, start: 4, end: 5 })
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('ignores the trashed element (headers & status)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`)
          hasStatusAndHeaders(res, 200, Object.assign({}, headers, { 'x-total-count': '10' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('ignores the trashed element (body)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`)
          expect(res.body).to.containSubset({ total: 10, start: 4, end: 5 })
          expect(res.body.pages).to.have.lengthOf(2)
        })
      })

      describe('Authenticated user calls', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('returns correct status and headers', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
          hasStatusAndHeaders(res, 200, Object.assign({}, headers, { 'x-total-count': '11' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('returns your results', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
          expect(res.body).to.containSubset({ total: 11, start: 4, end: 5 })
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('ignores the trashed element (headers & status)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
          hasStatusAndHeaders(res, 200, Object.assign({}, headers, { 'x-total-count': '11' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('ignores the trashed element (body)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
          expect(res.body).to.containSubset({ total: 11, start: 4, end: 5 })
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
          hasStatusAndHeaders(res, 200, Object.assign({}, headers, { 'x-total-count': '12' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('returns your results', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
          expect(res.body).to.containSubset({ total: 12, start: 4, end: 5 })
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('ignores the trashed element (headers & status)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
          hasStatusAndHeaders(res, 200, Object.assign({}, headers, { 'x-total-count': '12' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('ignores the trashed element (body)', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
          expect(res.body).to.containSubset({ total: 12, start: 4, end: 5 })
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
          hasStatusAndHeaders(res, 200, Object.assign({}, headers, { 'x-total-count': '13' }))
          hasLinkHeader(res, ['first', 'previous', 'next', 'last'])
        })

        it('returns your results', async () => {
          res = await request(api).get(`${base}/pages?${query}`).set(auth)
          expect(res.body).to.containSubset({ total: 13, start: 4, end: 5 })
          expect(res.body.pages).to.have.lengthOf(2)
        })

        it('returns correct status and headers for a trashed query', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
          hasStatusAndHeaders(res, 200, Object.assign({}, headers, { 'x-total-count': '5' }))
          hasLinkHeader(res, ['first', 'previous'])
        })

        it('returns your results for a trashed query', async () => {
          res = await request(api).get(`${base}/pages?${query}&trashed=true`).set(auth)
          expect(res.body).to.containSubset({ total: 5, start: 4, end: 5 })
          expect(res.body.pages).to.have.lengthOf(1)
        })
      })
    })

    describe('POST /pages', () => {
      const data = {
        title: 'New Page',
        body: 'This is a new page.'
      }

      describe('application/x-www-form-urlencoded', () => {
        beforeEach(async () => {
          res = await request(api).post(`${base}/pages`).send(data)
        })

        it('creates a page', async () => {
          const testHeaders = Object.assign({}, headers, { location: /\/pages\/[0-9a-f]*?$/ })
          await isPage(res, { headers: testHeaders })
        })
      })

      describe('Multipart form with file upload', () => {
        beforeEach(async () => {
          res = await request(api).post(`${base}/pages`)
            .field('title', data.title)
            .field('body', data.body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
        })

        it('creates a page with a file and a thumbnail', async () => {
          const testHeaders = Object.assign({}, headers, { location: /\/pages\/[0-9a-f]*?$/ })
          const file = { key: /icon\.\d+\.png/, size: 57018, value: 'image/png' }
          const thumbnail = { key: /icon\.thumbnail\.\d+\.png/, size: 26164, value: 'image/png' }
          const page = await isPage(res, { headers: testHeaders, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })
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
          hasStatusAndHeaders(res, 400, headers)
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
          hasStatusAndHeaders(res, 403, headers)
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
          hasStatusAndHeaders(res, 403, headers)
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
          hasStatusAndHeaders(res, 204, headers)
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
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    describe('OPTIONS /pages/:pid', () => {
      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login`)
          })

          it('returns 400 and correct headers', () => {
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}`)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })
      })
    })

    describe('HEAD /pages/:pid', () => {
      let pid: string
      let path: string

      describe('Anonymous', () => {
        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.anyone]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.auth]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.editor]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.admin]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).head(`${base}/pages${path}`)
          hasStatusAndHeaders(res, 400, headers)
        })
      })

      describe('Authenticated user', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.anyone]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.auth]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.editor]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.admin]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).head(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
        })
      })

      describe('Editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.anyone]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.auth]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.editor]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.admin]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).head(`${base}/pages${path}`).set(auth)
          hasStatusAndHeaders(res, 400, headers)
        })
      })

      describe('Admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.anyone]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.auth]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.editor]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.admin]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${path}`).set(auth)
            })

            it('returns status and headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).head(`${base}/pages${path}`).set(auth)
          hasStatusAndHeaders(res, 400, headers)
        })
      })
    })

    describe('GET /pages/:pid', () => {
      let pid: string
      let path: string

      describe('Anonymous', () => {
        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.anyone]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.auth]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.editor]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.admin]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).get(`${base}/pages${path}`)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('Authenticated user', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.anyone]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.auth]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.editor]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.admin]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).get(`${base}/pages${path}`).set(auth)
          expect(res.status).to.equal(400)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('Editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.anyone]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.auth]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.editor]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.admin]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns an error message', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).get(`${base}/pages${path}`).set(auth)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('Admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.anyone]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.auth]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.editor]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid, path } = await createTestPage([revisions.admin]))
          })

          describe('by page ID', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })

          describe('by path', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${path}`).set(auth)
            })

            it('returns the page', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body.revisions[0].content).to.containSubset({ title, body })
            })
          })
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).get(`${base}/pages${path}`).set(auth)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })
    })

    describe('PUT /pages/:pid', () => {
      const title = 'New Revision'
      const body = 'This is the revised body.'
      const permissions = { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
      const update = { title, body, permissions, msg: 'New revision' }
      const file = { key: /icon\.\d*\.png/, size: 57018, mime: 'image/png' }
      const thumbnail = { key: /icon\.thumbnail\.\d*\.png/, size: 26164, mime: 'image/png' }

      describe('An anonymous user', () => {
        it('can update a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
        })

        it('can add files to a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).put(`${base}/pages/${pid}`)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('won\'t update a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('won\'t update a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('won\'t update a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).put(`${base}/pages/${pid}`).send(update)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).send(update)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('An authenticated user', () => {
        const user = new User()

        beforeEach(async () => {
          const { access } = await getTokens({ user })
          auth.Authorization = `Bearer ${access}`
        })

        it('can update a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(user.id?.toString())
        })

        it('can add files to a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can update a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(user.id?.toString())
        })

        it('can add files to a page only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can\'t update a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('can\'t update a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set(auth).send(update)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('An editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('can update a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can add files to a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can update a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can add files to a page only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can update a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(editor.id?.toString())
        })

        it('can add files to a page only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can\'t update a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after?.revisions).to.have.lengthOf(1)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set(auth).send(update)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('An admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('can update a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can add files to a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can untrash a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone], true)
          res = await request(api).put(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can add files to a page only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can untrash a page only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite], true)
          res = await request(api).put(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can add files to a page only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can untrash a page only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite], true)
          res = await request(api).put(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can update a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).put(`${base}/pages/${pid}`).set(auth).send(update)
          const after = await loadPageById(pid, admin)
          const mostRecentEditorId = after?.revisions[0].editor?.id
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.revisions).to.have.lengthOf(2)
          expect(mostRecentEditorId).to.equal(admin.id?.toString())
        })

        it('can add files to a page only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).put(`${base}/pages/${pid}`)
            .set(auth)
            .field('title', title)
            .field('body', body)
            .attach('file', `${dir}/files/icon.png`)
            .attach('thumbnail', `${dir}/files/icon.thumbnail.png`)
          const revision = { content: { title, path: '/new-revision', body } }
          const page = await isPage(res, { headers, revision, file, thumbnail })

          if (page !== null) {
            await page.revisions[0].file?.delete()
            await page.revisions[0].thumbnail?.delete()
          }
        })

        it('can untrash a page only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite], true)
          res = await request(api).put(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).put(`${base}/pages${path}`).set(auth).send(update)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })
    })

    describe('DELETE /pages/:pid', () => {
      describe('An anonymous user', () => {
        it('can delete a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('won\'t delete a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).delete(`${base}/pages/${pid}`)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('won\'t hard delete a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 401, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('An authenticated user', () => {
        beforeEach(async () => {
          const { access } = await getTokens()
          auth.Authorization = `Bearer ${access}`
        })

        it('can delete a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set(auth)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('An editor', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: editor })
          auth.Authorization = `Bearer ${access}`
        })

        it('can delete a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can delete a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can\'t hard delete a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('can\'t delete a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after?.trashed).to.equal(undefined)
        })

        it('can\'t hard delete a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 403, headers)
          expect(after).to.be.an.instanceOf(Page)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set(auth)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })

      describe('An admin', () => {
        beforeEach(async () => {
          const { access } = await getTokens({ user: admin })
          auth.Authorization = `Bearer ${access}`
        })

        it('can delete a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page anyone can edit', async () => {
          const { pid } = await createTestPage([revisions.anyone])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.equal(null)
        })

        it('can delete a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only users can edit', async () => {
          const { pid } = await createTestPage([revisions.authWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.equal(null)
        })

        it('can delete a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only editors can edit', async () => {
          const { pid } = await createTestPage([revisions.editorWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.equal(null)
        })

        it('can delete a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).delete(`${base}/pages/${pid}`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after?.trashed).to.be.an.instanceOf(Date)
        })

        it('can hard delete a page that only admins can edit', async () => {
          const { pid } = await createTestPage([revisions.adminWrite])
          res = await request(api).delete(`${base}/pages/${pid}?hard=true`).set(auth)
          const after = await loadPageById(pid, admin)
          hasStatusAndHeaders(res, 200, headers)
          expect(after).to.equal(null)
        })

        it('catches an invalid path', async () => {
          const path = '/login'
          const res = await request(api).delete(`${base}/pages${path}`).set(auth)
          hasStatusAndHeaders(res, 400, headers)
          expect(res.body).to.containSubset({ path, message: 'First element cannot be any of login, logout, dashboard, or connect.' })
        })
      })
    })
  })

  describe('/pages/:pid/revisions', () => {
    const allow = 'OPTIONS, HEAD, GET'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    describe('OPTIONS /pages/:pid/revisions', () => {
      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions`)
          })

          it('returns 400 and correct headers', () => {
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}/revisions`)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })
      })
    })

    describe('HEAD /pages/:pid/revisions', () => {
      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions`)
          })

          it('returns 400 and correct headers', () => {
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).head(`${base}/pages/${pid}/revisions`)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).head(`${base}/pages/${pid}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).head(`${base}/pages/${pid}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).head(`${base}/pages/${pid}/revisions`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).head(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns 200 and correct headers', () => {
            hasStatusAndHeaders(res, 200, headers)
          })
        })
      })
    })

    describe('GET /pages/:pid/revisions', () => {
      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions`)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).get(`${base}/pages/${pid}/revisions`)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).get(`${base}/pages/${pid}/revisions`)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 404, headers)
            expect(res.body.message).to.equal('Page not found.')
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).get(`${base}/pages/${pid}/revisions`)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 404, headers)
            expect(res.body.message).to.equal('Page not found.')
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).get(`${base}/pages/${pid}/revisions`)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 404, headers)
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 404, headers)
            expect(res.body.message).to.equal('Page not found.')
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 404, headers)
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 404, headers)
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).get(`${base}/pages/${pid}/revisions`).set(auth)
          })

          it('returns the page\'s revisions', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(isPopulatedArray(res.body)).to.equal(true)
            expect(res.body[0].content).to.containSubset({ title: 'New Page', path: '/new-page', body: 'This is a new page.' })
          })
        })
      })
    })
  })

  describe('/pages/:pid/revisions/:revision', () => {
    const allow = 'OPTIONS, HEAD, GET, PUT'
    const headers = {
      allow,
      'access-control-allow-methods': allow
    }

    describe('OPTIONS /pages/:pid/revisions/:revision', () => {
      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).options(`${base}/pages/login/revisions/1`)
          })

          it('returns 400 and correct headers', () => {
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 404 and correct headers', () => {
            hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('calling a page anyone can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyone])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only users can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.auth])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only editors can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editor])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })

        describe('calling a page only admins can read', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.admin])
            res = await request(api).options(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns 204 and correct headers', () => {
            hasStatusAndHeaders(res, 204, headers)
          })
        })
      })
    })

    describe('HEAD /pages/:pid/revisions/:revision', () => {
      let pid: string

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).head(`${base}/pages/login/revisions/1`)
          })

          it('returns 400 and correct headers', () => {
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.authUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.editorUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.adminUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.authUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.editorUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.adminUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.authUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.editorUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.adminUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 404 and correct headers', () => {
              hasStatusAndHeaders(res, 404, headers)
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
            hasStatusAndHeaders(res, 400, headers)
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.authUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.editorUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.adminUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns 400 and correct headers', () => {
              hasStatusAndHeaders(res, 400, headers)
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).head(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns 200 and correct headers', () => {
              hasStatusAndHeaders(res, 200, headers)
            })
          })
        })
      })
    })

    describe('GET /pages/:pid/revisions/:revision', () => {
      let pid: string
      const anyoneRevisionMatch = {
        content: {
          title: revisions.anyone.content.title,
          path: '/new-page',
          body: revisions.anyone.content.body
        },
        permissions: Object.assign({}, revisions.anyone.permissions)
      }

      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).get(`${base}/pages/login/revisions/1`)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.anyoneUpdate))
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.authUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.editorUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.adminUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset(({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' }))
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.anyoneUpdate))
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.authUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.authUpdate))
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.editorUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.adminUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.anyoneUpdate))
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.authUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.authUpdate))
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.editorUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.editorUpdate))
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.adminUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
              expect(res.body.message).to.equal('Page not found.')
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 404, headers)
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('requesting from a page anyone can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.anyoneUpdate))
            })
          })
        })

        describe('requesting from a page only users can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.authUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.authUpdate))
            })
          })
        })

        describe('requesting from a page only editors can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.editorUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.editorUpdate))
            })
          })
        })

        describe('requesting from a page only admins can read', () => {
          beforeEach(async () => {
            ({ pid } = await createTestPage([revisions.adminUpdate, revisions.anyone]))
          })

          describe('a revision that doesn\'t exist', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/3`).set(auth)
            })

            it('returns an error', () => {
              hasStatusAndHeaders(res, 400, headers)
              expect(res.body.message).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
            })
          })

          describe('a revision', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1`).set(auth)
            })

            it('returns the revision requested', () => {
              hasStatusAndHeaders(res, 200, headers)
              expect(res.body).to.containSubset(anyoneRevisionMatch)
            })
          })

          describe('the difference between two revisions', () => {
            beforeEach(async () => {
              res = await request(api).get(`${base}/pages/${pid}/revisions/1?compare=2`).set(auth)
            })

            it('returns the difference', () => {
              hasStatusAndHeaders(res, 200, headers)
              doesDiff(res.body, new Revision(revisions.anyone), new Revision(revisions.adminUpdate))
            })
          })
        })
      })
    })

    describe('PUT /pages/:pid/revisions/:revision', () => {
      describe('Anonymous user', () => {
        describe('calling an invalid path', () => {
          beforeEach(async () => {
            res = await request(api).put(`${base}/pages/login/revisions/1`)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('rolling back a page anyone can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only users can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.authWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`)
          })

          it('returns an error', () => {
            const authenticate = 'Bearer error="invalid_token" error_description="The access token could not be verified."'
            hasStatusAndHeaders(res, 401, Object.assign({}, headers, { 'www-authenticate': authenticate }))
            expect(res.body.message).to.equal('This method requires authentication.')
          })
        })

        describe('rolling back a page only editors can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editorWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`)
          })

          it('returns an error', () => {
            const authenticate = 'Bearer error="invalid_token" error_description="The access token could not be verified."'
            hasStatusAndHeaders(res, 401, Object.assign({}, headers, { 'www-authenticate': authenticate }))
            expect(res.body.message).to.equal('This method requires authentication.')
          })
        })

        describe('rolling back a page only admins can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.adminWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`)
          })

          it('returns an error', () => {
            const authenticate = 'Bearer error="invalid_token" error_description="The access token could not be verified."'
            hasStatusAndHeaders(res, 401, Object.assign({}, headers, { 'www-authenticate': authenticate }))
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('rolling back a page anyone can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only users can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.authWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only editors can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editorWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 403, headers)
            expect(res.body.message).to.equal('You do not have permission to update this page.')
          })
        })

        describe('rolling back a page only admins can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.adminWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 403, headers)
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('rolling back a page anyone can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only users can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.authWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only editors can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editorWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only admins can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.adminWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns an error', () => {
            hasStatusAndHeaders(res, 403, headers)
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

          it('returns an error', () => {
            hasStatusAndHeaders(res, 400, headers)
            expect(res.body).to.containSubset({ path: '/login', message: 'First element cannot be any of login, logout, dashboard, or connect.' })
          })
        })

        describe('rolling back a page anyone can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.anyoneUpdate, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only users can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.authWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only editors can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.editorWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })

        describe('rolling back a page only admins can edit', () => {
          beforeEach(async () => {
            const { pid } = await createTestPage([revisions.adminWrite, revisions.anyone])
            res = await request(api).put(`${base}/pages/${pid}/revisions/1`).set(auth)
          })

          it('returns the updated page', () => {
            hasStatusAndHeaders(res, 200, headers)
            expect(res.body.revisions).to.have.lengthOf(3)
            expect(res.body.revisions[0].msg).to.equal('Rolling back to revision #1')
          })
        })
      })
    })
  })
})
