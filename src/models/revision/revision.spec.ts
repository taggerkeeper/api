import { expect } from 'chai'
import Content from '../content/content.js'
import User from '../user/user.js'
import Revision from './revision.js'

describe('Revision', () => {
  describe('constructor', () => {
    const before = new Date()
    const title = 'My Revision'
    const body = 'This is a revision that I made.'
    const msg = 'This is a test revision.'
    const editor = new User()
    const content = new Content(title, body)
    const actual = new Revision(content, editor, msg)

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

    it('sets the timestamp', () => {
      const after = new Date()
      const { timestamp } = actual
      expect(timestamp >= before && timestamp <= after).to.equal(true)
    })
  })
})
