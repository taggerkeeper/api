import { expect } from 'chai'
import Content from './content.js'

describe('Content', () => {
  describe('consructor', () => {
    const title = 'My Content'
    const body = 'This is the body of my content.'
    const actual = new Content(title, body)

    it('assigns a title', () => {
      expect(actual.title).to.equal(title)
    })

    it('assigns a body', () => {
      expect(actual.body).to.equal(body)
    })
  })
})
