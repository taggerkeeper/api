import { expect } from 'chai'
import Content from '../content/content.js'
import User from '../user/user.js'
import Revision from '../revision/revision.js'
import Page from './page.js'

describe('Page', () => {
  describe('constructor', () => {
    const before = new Date()
    const title = 'Test Page'
    const body = 'This is a test page.'
    const content = new Content({ title, body })
    const editor = new User()
    const rev = new Revision({ content, editor: editor.getObj(), msg: 'Initial text' })
    const actual = new Page({ revisions: [rev.getObj()] })
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
})
