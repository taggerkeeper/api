import { expect } from 'chai'
import File from './file.js'
import { isFileData } from './data.js'

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

  describe('Instance methods', () => {
    describe('reportSize', () => {
      it('reports bytes', () => {
        const file = new File(Object.assign({}, data, { size: 120 }))
        expect(file.reportSize()).to.equal('120 B')
      })

      it('reports kilobytes', () => {
        const file = new File(Object.assign({}, data, { size: 120000 }))
        expect(file.reportSize()).to.equal('120 kB')
      })

      it('reports megabytes', () => {
        const file = new File(Object.assign({}, data, { size: 120000000 }))
        expect(file.reportSize()).to.equal('120 MB')
      })

      it('reports gigabytes', () => {
        const file = new File(Object.assign({}, data, { size: 120000000000 }))
        expect(file.reportSize()).to.equal('120 GB')
      })
    })

    describe('getObj', () => {
      const file = new File(data)

      it('returns an object', () => {
        expect(typeof file.getObj()).to.equal('object')
      })

      it('returns a FileData object', () => {
        expect(isFileData(file.getObj())).to.equal(true)
      })
    })
  })

  describe('Static methods', () => {
    describe('getS3Client', () => {
      it('returns an AWS SDK S3 client', () => {
        const client = File.getS3Client()
        expect(client.constructor.name).to.equal('S3Client')
      })
    })
  })
})
