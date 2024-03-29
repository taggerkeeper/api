import { expect } from 'chai'
import * as sinon from 'sinon'
import Content from '../content/content.js'
import File from '../file/file.js'
import User from '../user/user.js'
import Revision from '../revision/revision.js'
import Page from './page.js'
import PageModel from './model.js'
import { isPageData } from './data.js'
import { isPublicPageData } from './public.js'

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

  const file = new File({ location: '/path/to/file.txt', key: 'file.txt', mime: 'text/plain', size: 12345 })

  let before: Date
  let after: Date
  let actual: Page

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

    it('numbers revisions', () => {
      expect(actual.revisions[0].number).to.equal(1)
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

    describe('getPublicObj', () => {
      it('returns a PublicPageData object', () => {
        expect(isPublicPageData(actual.getPublicObj())).to.equal(true)
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
      it('adds another revision to the revisions array', () => {
        actual.addRevision(update)
        expect(actual.revisions).to.have.lengthOf(2)
      })

      it('makes the new revision the first in the revisions array', () => {
        actual.addRevision(update)
        expect(actual.revisions[0].msg).to.equal(updatedMsg)
      })

      it('sets the page\'s updated timestamp to the new revision\'s timestamp', () => {
        actual.addRevision(update)
        expect(actual.updated).to.equal(update.timestamp)
      })

      it('inherits file by default', () => {
        const orig = new Revision({ content, file, editor: editor.getObj(), msg: 'Initial text' })
        const page = new Page({ revisions: [orig] })
        page.addRevision(update)
        expect(page.revisions[0].file?.location).to.equal(file.location)
      })

      it('inherits thumbnail by default', () => {
        const orig = new Revision({ content, thumbnail: file, editor: editor.getObj(), msg: 'Initial text' })
        const page = new Page({ revisions: [orig] })
        page.addRevision(update)
        expect(page.revisions[0].thumbnail?.location).to.equal(file.location)
      })

      it('doesn\'t inherit file if told not to', () => {
        const orig = new Revision({ content, file, editor: editor.getObj(), msg: 'Initial text' })
        const page = new Page({ revisions: [orig] })
        page.addRevision(update, false)
        expect(page.revisions[0].file).to.equal(undefined)
      })

      it('doesn\'t inherit thumbnail if told not to', () => {
        const orig = new Revision({ content, thumbnail: file, editor: editor.getObj(), msg: 'Initial text' })
        const page = new Page({ revisions: [orig] })
        page.addRevision(update, false)
        expect(page.revisions[0].thumbnail).to.equal(undefined)
      })
    })

    describe('getRevision', () => {
      it('returns null if asked for revision 0', () => {
        actual.addRevision(update)
        expect(actual.getRevision(0)).to.equal(null)
      })

      it('returns null if asked for a revision greater than the number of revisions', () => {
        actual.addRevision(update)
        expect(actual.getRevision(3)).to.equal(null)
      })

      it('returns a Revision instance if given a valid number', () => {
        actual.addRevision(update)
        const revision = actual.getRevision(2)
        expect(revision).to.be.an.instanceOf(Revision)
      })

      it('returns the original revision if given 1', () => {
        actual.addRevision(update)
        const revision = actual.getRevision(1)
        expect(revision?.content.title).to.equal(title)
      })

      it('returns a later revision if given a higher number', () => {
        actual.addRevision(update)
        const revision = actual.getRevision(2)
        expect(revision?.content.title).to.equal(updatedTitle)
      })
    })

    describe('getRevisionFromStr', () => {
      it('returns an error message if not given a string that can be parsed into an integer', () => {
        actual.addRevision(update)
        const revision = actual.getRevisionFromStr('lolnope')
        expect(revision).to.equal('lolnope is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
      })

      it('returns an error message if given a number that\'s too low', () => {
        actual.addRevision(update)
        const revision = actual.getRevisionFromStr('0')
        expect(revision).to.equal('0 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
      })

      it('returns an error message if given a number that\'s too high', () => {
        actual.addRevision(update)
        const revision = actual.getRevisionFromStr('3')
        expect(revision).to.equal('3 is not a valid number for any revision of this page. Please provide a number between 1 and 2.')
      })

      it('returns the original revision as 1', () => {
        actual.addRevision(update)
        const revision = actual.getRevisionFromStr('1')
        expect(revision).to.be.an.instanceOf(Revision)
        expect((revision as Revision)?.content.title).to.equal(title)
      })

      it('returns later revisions for higher indices', () => {
        actual.addRevision(update)
        const revision = actual.getRevisionFromStr('2')
        expect(revision).to.be.an.instanceOf(Revision)
        expect((revision as Revision)?.content.title).to.equal(updatedTitle)
      })
    })

    describe('rollback', () => {
      beforeEach(() => {
        actual.addRevision(update)
        actual.rollback(actual.getRevision(1) as Revision, editor)
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

      it('doesn\'t inherit file or thumbnail', () => {
        const file = { location: '/path/to/test.txt', key: 'test.txt', mime: 'plain/text', size: 12345 }
        const withFile = new Revision(Object.assign({}, update, { file }))
        actual.addRevision(withFile)
        actual.rollback(actual.getRevision(1) as Revision, editor)
        expect(actual.revisions[0].file).to.equal(undefined)
      })

      it('doesn\'t inherit thumbnail', () => {
        const thumbnail = { location: '/path/to/thumb.jpg', key: 'thumb.jpg', mime: 'image/jpeg', size: 12345 }
        const withThumbnail = new Revision(Object.assign({}, update, { thumbnail }))
        actual.addRevision(withThumbnail)
        actual.rollback(actual.getRevision(1) as Revision, editor)
        expect(actual.revisions[0].thumbnail).to.equal(undefined)
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

    describe('untrash', () => {
      let stub: sinon.SinonStub
      const pid = 'abcdef0123456789abcdef01'
      beforeEach(() => { stub = sinon.stub(PageModel, 'updateOne') })
      afterEach(() => sinon.restore())

      it('deletes the trashed timestamp', async () => {
        const page = new Page({ id: pid, revisions: [], trashed: new Date() })
        await page.untrash()
        expect(page.trashed).to.equal(undefined)
      })

      it('untrashes the database record', async () => {
        const page = new Page({ id: pid, revisions: [], trashed: new Date() })
        await page.untrash()
        expect(stub.args[0][1].$unset.trashed).to.equal(1)
      })
    })

    describe('delete', () => {
      const pid = 'abcdef0123456789abcdef01'
      let stub: sinon.SinonStub
      let spy: sinon.SinonSpy
      let page: Page
      const revisions = [
        { content: { title: 'No File', path: '/test', body: 'File removed.' } },
        {
          content: { title: 'Updated File', path: '/test', body: 'File updated.' },
          file: { location: '/path/to/updated.txt', key: 'updated.txt', mime: 'plain/text', size: 23456 },
          thumbnail: { location: '/path/to/thumb.jpg', key: 'thumb.jpg', mime: 'image/jpeg', size: 65432 }
        },
        {
          content: { title: 'Original File', path: '/test', body: 'File uploaded.' },
          file: { location: '/path/to/test.txt', key: 'test.txt', mime: 'plain/text', size: 12345 },
          thumbnail: { location: '/path/to/thumbnail.png', key: 'thumbnail.png', mime: 'image/png', size: 54321 }
        }
      ]

      beforeEach(() => {
        stub = sinon.stub(PageModel, 'findByIdAndDelete')
        spy = sinon.spy()
        page = new Page({ id: pid, revisions })
      })

      afterEach(() => sinon.restore())

      it('deletes all of the files in the page\'s history', async () => {
        await page.delete(spy)
        expect(spy.callCount).to.equal(4)
        expect(spy.args.map(call => call[0].Key).join(' ')).to.equal('updated.txt test.txt thumb.jpg thumbnail.png')
      })

      it('deletes the page', async () => {
        await page.delete(spy)
        expect(stub.args[0][0]).to.equal(pid)
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
