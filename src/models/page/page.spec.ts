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
  const title = 'Test Page'
  const body = 'This is a test page.'
  const content = new Content({ title, body })
  const editor = new User()
  const rev = new Revision({ content, editor: editor.getObj(), msg: 'Initial text' })

  const updatedTitle = 'UpdatedTest Page'
  const updatedBody = 'This is an updated test page.'
  const updatedMsg = 'Update'
  const updatedContent = new Content({ title: updatedTitle, body: updatedBody })
  const update = new Revision({ content: updatedContent, editor: editor.getObj(), msg: updatedMsg })

  let before: Date
  let after: Date
  let actual: Page

  const runTestUpdate = (): void => {
    actual.addRevision(update)
  }

  beforeEach(() => {
    before = new Date()
    actual = new Page({ id, revisions: [rev.getObj()] })
    after = new Date()
  })

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

    describe('getCurr', () => {
      it('returns null if the page doesn\'t have any revisions', () => {
        const empty = new Page({ revisions: [] })
        expect(empty.getCurr()).to.equal(null)
      })

      it('returns a Revision instance', () => {
        expect(actual.getCurr()).to.be.an.instanceOf(Revision)
      })

      it('returns the most recent revision', () => {
        expect(actual.getCurr()?.content.title).to.equal(title)
      })
    })

    describe('addRevision', () => {
      beforeEach(() => runTestUpdate())

      it('adds another revision to the revisions array', () => {
        expect(actual.revisions).to.have.lengthOf(2)
      })

      it('makes the new revision the first in the revisions array', () => {
        expect(actual.revisions[0].msg).to.equal(updatedMsg)
      })

      it('sets the page\'s updated timestamp to the new revision\'s timestamp', () => {
        expect(actual.updated).to.equal(update.timestamp)
      })
    })

    describe('getRevision', () => {
      beforeEach(() => runTestUpdate())

      it('returns null if asked for revision 0', () => {
        expect(actual.getRevision(0)).to.equal(null)
      })

      it('returns null if asked for a revision greater than the number of revisions', () => {
        expect(actual.getRevision(3)).to.equal(null)
      })

      it('returns a Revision instance if given a valid number', () => {
        const revision = actual.getRevision(2)
        expect(revision).to.be.an.instanceOf(Revision)
      })

      it('returns the revision requested if given a valid number', () => {
        const revision = actual.getRevision(2)
        expect(revision?.content.title).to.equal(updatedTitle)
      })
    })

    describe('rollback', () => {
      beforeEach(() => {
        runTestUpdate()
        actual.rollback(1, editor)
      })

      it('adds another revision to the revisions array', () => {
        expect(actual.revisions).to.have.lengthOf(3)
      })

      it('sets the page\'s updated timestamp to the rollback\'s timestamp', () => {
        expect(actual.updated).to.equal(actual.revisions[0].timestamp)
      })

      it('sets the title from the revision being rolled back to', () => {
        expect(actual.revisions[0].content.title).to.equal(actual.revisions[2].content.title)
      })

      it('sets the body from the revision being rolled back to', () => {
        expect(actual.revisions[0].content.body).to.equal(actual.revisions[2].content.body)
      })

      it('sets the read permissions from the revision being rolled back to', () => {
        expect(actual.revisions[0].permissions.read).to.equal(actual.revisions[2].permissions.read)
      })

      it('sets the write permissions from the revision being rolled back to', () => {
        expect(actual.revisions[0].permissions.write).to.equal(actual.revisions[2].permissions.write)
      })

      it('sets a message indicating that it is a rollback', () => {
        expect(actual.revisions[0].msg).to.equal('Rolling back to revision #1: Initial text')
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

  describe('Static methods', () => {
    describe('render', () => {
      it('renders Markdown', async () => {
        const actual = await Page.render('_italic_ **bold**\n\nSeparate paragraph')
        expect(actual).to.equal('<p><em>italic</em> <strong>bold</strong></p>\n<p>Separate paragraph</p>')
      })
    })
  })
})
