import { expect } from 'chai'
import * as sinon from 'sinon'
import Content from '../content/content.js'
import User from '../user/user.js'
import Revision from '../revision/revision.js'
import Page from './page.js'
import PageModel from './model.js'
import { isPageData } from './data.js'

describe('Page', () => {
  const id = '012345abcdef'
  const before = new Date()
  const title = 'Test Page'
  const body = 'This is a test page.'
  const content = new Content({ title, body })
  const editor = new User()
  const rev = new Revision({ content, editor: editor.getObj(), msg: 'Initial text' })
  const actual = new Page({ id, revisions: [rev.getObj()] })
  const after = new Date()

  describe('constructor', () => {
    it('sets the ID', () => {
      expect(actual.id).to.equal(id)
    })

    it('sets the revision history', () => {
      expect(actual.revisions).to.have.lengthOf(1)
    })

    it('sets an array of Revision instances as its history', () => {
      expect(actual.revisions[0]).to.be.an.instanceOf(Revision)
    })

    it('sets the created timestamp', () => {
      const { created } = actual
      expect(created >= before && created <= after).to.equal(true)
    })

    it('sets the updated timestamp', () => {
      const { updated } = actual
      expect(updated >= before && updated <= after).to.equal(true)
    })

    it('leaves the trashed timestamp undefined', () => {
      expect(actual.trashed).to.equal(undefined)
    })
  })

  describe('Instance methods', () => {
    describe('getObj', () => {
      it('returns a PageData object', () => {
        expect(isPageData(actual.getObj())).to.equal(true)
      })
    })

    describe('save', () => {
      const _id = 'abc123'

      afterEach(() => sinon.restore())

      it('creates a new record if the model doesn\'t have an ID', async () => {
        const create = sinon.stub(PageModel, 'create').callsFake((): any => {
          return new Promise(resolve => resolve({ _id }))
        })
        const page = new Page()
        await page.save()
        expect(create.callCount).to.equal(1)
      })

      it('sets the new ID if it didn\'t have one before', async () => {
        sinon.stub(PageModel, 'create').callsFake((): any => {
          return new Promise(resolve => resolve({ _id }))
        })
        const page = new Page()
        await page.save()
        expect(page.id).to.equal(_id)
      })

      it('updates the record if the model already has an ID', async () => {
        const findOneAndUpdate = sinon.stub(PageModel, 'findOneAndUpdate')
        const page = new Page({ _id, revisions: [] })
        await page.save()
        expect(findOneAndUpdate.callCount).to.equal(1)
      })

      it('keeps the existing ID if it already has one', async () => {
        sinon.stub(PageModel, 'findOneAndUpdate')
        const page = new Page({ _id, revisions: [] })
        await page.save()
        expect(page.id).to.equal(_id)
      })
    })
  })
})
