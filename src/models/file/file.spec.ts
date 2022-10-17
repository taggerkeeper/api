import { expect } from 'chai'
import File from './file.js'

describe('File', () => {
  const data = { location: '/path/to/file.txt', key: 'file.txt', mime: 'text/plain', size: 12345 }

  describe('constructor', () => {
    it('sets the data', () => {
      const file = new File(data)
      expect(file.location).to.equal(data.location)
      expect(file.key).to.equal(data.key)
      expect(file.mime).to.equal(data.mime)
      expect(file.size).to.equal(data.size)
    })
  })
})
