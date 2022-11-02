import {expect} from 'chai'
import Content from '../content/content.js'
import File from '../file/file.js'
import User from '../user/user.js'
import Permissions from '../permissions/permissions.js'
import {PermissionLevel} from '../permissions/data.js'
import Revision from './revision.js'
import {isRevisionData} from './data.js'
import {isPublicRevisionData} from './public.js'

describe('Revision', () => {
  const before = new Date()
  const title = 'My Revision'
  const body = 'This is a revision that I made.'
  const msg = 'This is a test revision.'
  const editor = new User()
  const content = new Content({ title, body })
  const actual = new Revision({ content, editor: editor.getObj(), msg })
  const file = new File({ location: '/path/to/file.txt', key: 'file.txt', mime: 'text/plain', size: 12345 })

  describe('constructor', () => {
    it('sets the content title', () => {
      expect(actual.content.title).to.equal(title)
    })

    it('sets the content body', () => {
      expect(actual.content.body).to.equal(body)
    })

    it('sets the editor', () => {
      expect(JSON.stringify(actual.editor)).to.equal(JSON.stringify(editor))
    })

    it('sets the message', () => {
      expect(actual.msg).to.equal(msg)
    })

    it('defaults to the default read permissions', () => {
      expect(actual.permissions.read).to.equal(PermissionLevel.anyone)
    })

    it('sets read permissions', () => {
      const permissions = new Permissions({ read: PermissionLevel.authenticated })
      const actual = new Revision({ content, editor: editor.getObj(), permissions, msg })
      expect(actual.permissions.read).to.equal(PermissionLevel.authenticated)
    })

    it('defaults to the default write permissions', () => {
      expect(actual.permissions.write).to.equal(PermissionLevel.anyone)
    })

    it('sets write permissions', () => {
      const permissions = new Permissions({ write: PermissionLevel.editor })
      const actual = new Revision({ content, editor: editor.getObj(), permissions, msg })
      expect(actual.permissions.write).to.equal(PermissionLevel.editor)
    })

    it('defaults the timestamp to now', () => {
      const after = new Date()
      const { timestamp } = actual
      expect(timestamp >= before && timestamp <= after).to.equal(true)
    })

    it('can set the timestamp', () => {
      const timestamp = new Date('1 August 2022')
      const actual = new Revision({ content, editor: editor.getObj(), msg, timestamp })
      expect(actual.timestamp).to.equal(timestamp)
    })

    it('can set a file', () => {
      const actual = new Revision({ content, file, editor: editor.getObj(), msg })
      expect(actual.file?.location).to.equal(file.location)
    })

    it('can set a thumbnail', () => {
      const actual = new Revision({ content, thumbnail: file, editor: editor.getObj(), msg })
      expect(actual.thumbnail?.location).to.equal(file.location)
    })
  })

  describe('Instance methods', () => {
    describe('getObj', () => {
      it('returns a RevisionData object', () => {
        expect(isRevisionData(actual.getObj())).to.equal(true)
      })
    })

    describe('getPublicObj', () => {
      it('returns a PublicRevisionData object', () => {
        expect(isPublicRevisionData(actual.getPublicObj())).to.equal(true)
      })
    })

    describe('diff', () => {
      it('returns the difference between two revisions', () => {
        const a = new Revision({ content: { title: 'Revision 1', path: '/test', body: 'This is the original version.' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone } })
        const b = new Revision({ content: { title: 'Revision 2', path: '/test', body: 'This is the updated version.' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.editor } })
        const diff = a.diff(b)
        const { content, file, thumbnail, permissions } = diff
        const { title, path, body } = content
        const { read, write } = permissions

        expect(Array.isArray(title)).to.equal(true)
        expect(title).to.have.lengthOf(3)
        expect(title[0].value).to.equal('Revision ')
        expect(title[1].removed).to.equal(true)
        expect(title[1].value).to.equal('1')
        expect(title[2].added).to.equal(true)
        expect(title[2].value).to.equal('2')

        expect(Array.isArray(path)).to.equal(true)
        expect(path).to.have.lengthOf(1)
        expect(path[0].value).to.equal('/test')

        expect(Array.isArray(body)).to.equal(true)
        expect(body).to.have.lengthOf(4)
        expect(body[0].value).to.equal('This is the ')
        expect(body[1].removed).to.equal(true)
        expect(body[1].value).to.equal('original')
        expect(body[2].added).to.equal(true)
        expect(body[2].value).to.equal('updated')
        expect(body[3].value).to.equal(' version.')

        expect(file.before).to.equal(null)
        expect(file.after).to.equal(null)

        expect(thumbnail.before).to.equal(null)
        expect(thumbnail.after).to.equal(null)

        expect(Array.isArray(read)).to.equal(true)
        expect(read).to.have.lengthOf(1)
        expect(read[0].value).to.equal('anyone')

        expect(Array.isArray(write)).to.equal(true)
        expect(write).to.have.lengthOf(2)
        expect(write[0].removed).to.equal(true)
        expect(write[0].value).to.equal('anyone')
        expect(write[1].added).to.equal(true)
        expect(write[1].value).to.equal('editor')
      })
    })
  })
})
