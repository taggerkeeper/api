import { expect } from 'chai'
import Content from '../content/content.js'
import User from '../user/user.js'
import Revision from '../revision/revision.js'
import Permissions from '../permissions/permissions.js'
import { PermissionLevel } from '../permissions/data.js'
import Page from './page.js'

describe('Page', () => {
  describe('constructor', () => {
    const before = new Date()
    const title = 'Test Page'
    const body = 'This is a test page.'
    const content = new Content({ title, body })
    const editor = new User()
    const rev = new Revision({ content, editor, msg: 'Initial text' })
    const actual = new Page({ revisions: [rev] })
    const after = new Date()

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

  describe('Static methods', () => {
    describe('loadObject', () => {
      const editor = {
        _id: '0123456789abcdef12345678',
        active: true,
        admin: false,
        password: 'hash',
        emails: [
          { addr: 'test@testing.com', verified: true, code: 'abc123' }
        ],
        otp: { enabled: false, secret: undefined }
      }

      const title = 'Updated Title'
      const path = '/test-page'
      const body = 'This is an updated page.'
      const msg = 'Changed title and body, changed permissions so only authenticated users can edit.'
      const created = new Date('31 July 2022')
      const updated = new Date('1 August 2022')

      const record = {
        revisions: [
          {
            content: { title, path, body },
            editor,
            permissions: { read: PermissionLevel.anyone, write: PermissionLevel.authenticated },
            timestamp: updated,
            msg
          },
          {
            content: { title: 'Original Title', path, body: 'This is a test page.' },
            editor,
            permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone },
            timestamp: created,
            msg: 'Initial text'
          }
        ],
        created,
        updated
      }

      it('returns a Page object', () => {
        const actual = Page.loadObject(record)
        expect(actual).to.be.an.instanceOf(Page)
      })

      it('loads an array of revisions', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions).to.be.an.instanceOf(Array)
      })

      it('loads all of the revisions', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions).to.have.lengthOf(record.revisions.length)
      })

      it('loads the revisions as instances of the Revision class', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0]).to.be.an.instanceOf(Revision)
      })

      it('loads content of each revision as an instance of the Content class', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].content).to.be.an.instanceOf(Content)
      })

      it('loads title from each revision', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].content.title).to.equal(title)
      })

      it('loads path from each revision', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].content.path).to.equal(path)
      })

      it('loads body from each revision', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].content.body).to.equal(body)
      })

      it('loads permissions of each revision as an instance of the Permissions class', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].permissions).to.be.an.instanceOf(Permissions)
      })

      it('loads read permissions from each revision', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].permissions.read).to.equal(PermissionLevel.anyone)
      })

      it('loads write permissions from each revision', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].permissions.write).to.equal(PermissionLevel.authenticated)
      })

      it('loads editor of each revision as an instance of the User class', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].editor).to.be.an.instanceOf(User)
      })

      it('loads timestamp of each revision as an instance of the Date class', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].timestamp).to.be.an.instanceOf(Date)
      })

      it('loads timestamp from each revision', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].timestamp).to.equal(updated)
      })

      it('loads message from each revision', () => {
        const actual = Page.loadObject(record)
        expect(actual.revisions[0].msg).to.equal(msg)
      })

      it('loads the page\'s created date as an instance of the Date class', () => {
        const actual = Page.loadObject(record)
        expect(actual.created).to.be.an.instanceOf(Date)
      })

      it('loads the page\'s created date', () => {
        const actual = Page.loadObject(record)
        expect(actual.created).to.equal(created)
      })

      it('loads the page\'s updated date as an instance of the Date class', () => {
        const actual = Page.loadObject(record)
        expect(actual.updated).to.be.an.instanceOf(Date)
      })

      it('loads the page\'s updated date', () => {
        const actual = Page.loadObject(record)
        expect(actual.updated).to.equal(updated)
      })
    })
  })
})
