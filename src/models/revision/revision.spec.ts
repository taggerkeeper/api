import { expect } from 'chai'
import Content from '../content/content.js'
import User from '../user/user.js'
import Permissions, { PermissionLevel } from '../permissions/permissions.js'
import Revision from './revision.js'

describe('Revision', () => {
  describe('constructor', () => {
    const before = new Date()
    const title = 'My Revision'
    const body = 'This is a revision that I made.'
    const msg = 'This is a test revision.'
    const editor = new User()
    const content = new Content({ title, body })
    const actual = new Revision({ content, editor, msg })

    it('sets the content title', () => {
      expect(actual.content.title).to.equal(title)
    })

    it('sets the content body', () => {
      expect(actual.content.body).to.equal(body)
    })

    it('sets the editor', () => {
      expect(actual.editor).to.equal(editor)
    })

    it('sets the message', () => {
      expect(actual.msg).to.equal(msg)
    })

    it('defaults to the default read permissions', () => {
      expect(actual.permissions.read).to.equal(PermissionLevel.anyone)
    })

    it('sets read permissions', () => {
      const permissions = new Permissions({ read: PermissionLevel.authenticated })
      const actual = new Revision({ content, editor, permissions, msg })
      expect(actual.permissions.read).to.equal(PermissionLevel.authenticated)
    })

    it('defaults to the default write permissions', () => {
      expect(actual.permissions.write).to.equal(PermissionLevel.anyone)
    })

    it('sets write permissions', () => {
      const permissions = new Permissions({ write: PermissionLevel.editor })
      const actual = new Revision({ content, editor, permissions, msg })
      expect(actual.permissions.write).to.equal(PermissionLevel.editor)
    })

    it('defaults the timestamp to now', () => {
      const after = new Date()
      const { timestamp } = actual
      expect(timestamp >= before && timestamp <= after).to.equal(true)
    })

    it('can set the timestamp', () => {
      const timestamp = new Date('1 August 2022')
      const actual = new Revision({ content, editor, msg, timestamp })
      expect(actual.timestamp).to.equal(timestamp)
    })
  })
})
