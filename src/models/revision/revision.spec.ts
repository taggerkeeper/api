import { expect } from 'chai'
import Content from '../content/content.js'
import User from '../user/user.js'
import Permissions from '../permissions/permissions.js'
import { PermissionLevel } from '../permissions/data.js'
import Revision from './revision.js'
import { isRevisionData } from './data.js'
import { isPublicRevisionData } from './public.js'

describe('Revision', () => {
  const before = new Date()
  const title = 'My Revision'
  const body = 'This is a revision that I made.'
  const msg = 'This is a test revision.'
  const editor = new User()
  const content = new Content({ title, body })
  const actual = new Revision({ content, editor: editor.getObj(), msg })

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
  })
})
