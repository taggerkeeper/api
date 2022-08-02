import { expect } from 'chai'
import slugify from 'slugify'
import Content from './content.js'
import { isContentData } from './data.js'

describe('Content', () => {
  const title = 'My Content'
  const body = 'This is the body of my content.'
  const actual = new Content({ title, body })

  describe('consructor', () => {
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

  describe('Instance methods', () => {
    describe('getObj', () => {
      it('returns an object', () => {
        expect(typeof actual.getObj()).to.equal('object')
      })

      it('returns a ContentData object', () => {
        expect(isContentData(actual.getObj())).to.equal(true)
      })
    })
  })
})
