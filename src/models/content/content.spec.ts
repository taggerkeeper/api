import { expect } from 'chai'
import slugify from 'slugify'
import Content from './content.js'

describe('Content', () => {
  describe('consructor', () => {
    const title = 'My Content'
    const body = 'This is the body of my content.'
    const actual = new Content({ title, body })

    it('assigns a title', () => {
      expect(actual.title).to.equal(title)
    })

    it('assigns a path', () => {
      expect(actual.path).to.equal(`/${slugify(title)}`)
    })

    it('can set a path', () => {
      const path = '/content'
      const actual = new Content({ title, path, body })
      expect(actual.path).to.equal(path)
    })

    it('assigns a body', () => {
      expect(actual.body).to.equal(body)
    })
  })
})
