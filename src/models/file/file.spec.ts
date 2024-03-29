import { expect } from 'chai'
import * as sinon from 'sinon'
import getEnvVar from '../../utils/get-env-var.js'
import File from './file.js'
import { isFileData } from './data.js'
import { isPublicFileData } from './public.js'

describe('File', () => {
  const data = { location: '/path/to/file.txt', key: 'file.txt', mime: 'text/plain', size: 12345 }
  const multerFile = { location: '/path/to/file.txt', key: 'file.txt', contentType: 'text/plain', size: 12345 }

  describe('constructor', () => {
    it('sets the data', () => {
      const file = new File(data)
      expect(file.location).to.equal(data.location)
      expect(file.key).to.equal(data.key)
      expect(file.mime).to.equal(data.mime)
      expect(file.size).to.equal(data.size)
    })

    it('can take a MulterS3 File', () => {
      const file = new File(multerFile as Express.MulterS3.File)
      expect(file.location).to.equal(data.location)
      expect(file.key).to.equal(data.key)
      expect(file.mime).to.equal(data.mime)
      expect(file.size).to.equal(data.size)
    })
  })

  describe('Instance methods', () => {
    describe('reportSize', () => {
      it('reports bytes', () => {
        const file = new File(Object.assign({}, data, { size: 123 }))
        expect(file.reportSize()).to.equal('123 B')
      })

      it('reports kilobytes', () => {
        const file = new File(Object.assign({}, data, { size: 123456 }))
        expect(file.reportSize()).to.equal('123.5 kB')
      })

      it('reports megabytes', () => {
        const file = new File(Object.assign({}, data, { size: 123456789 }))
        expect(file.reportSize()).to.equal('123.5 MB')
      })

      it('reports gigabytes', () => {
        const file = new File(Object.assign({}, data, { size: 123456789012 }))
        expect(file.reportSize()).to.equal('123.5 GB')
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

    describe('getPublicObj', () => {
      const file = new File(data)

      it('returns an object', () => {
        expect(typeof file.getPublicObj()).to.equal('object')
      })

      it('returns a PublicFileData object', () => {
        expect(isPublicFileData(file.getPublicObj())).to.equal(true)
      })
    })

    describe('delete', () => {
      it('sends a delete request to S3', async () => {
        const spy = sinon.spy()
        const bucket = getEnvVar('S3_BUCKET') as string
        const { key } = data
        const file = new File(data)
        await file.delete(spy)
        expect(JSON.stringify(spy.args[0][0])).to.equal(`{"Bucket":"${bucket}","Key":"${key}"}`)
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
