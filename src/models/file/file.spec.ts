import { expect } from 'chai'
import { mockClient } from 'aws-sdk-client-mock'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import getEnvVar from '../../utils/get-env-var.js'
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

    describe('delete', () => {
      const client = mockClient(S3Client)

      beforeEach(() => client.reset())

      it('sends a delete request to S3', async () => {
        client.on(DeleteObjectCommand).resolves({})
        const bucket = getEnvVar('S3_BUCKET') as string
        const { key } = data
        const file = new File(data)
        await file.delete()
        expect(JSON.stringify(client.call(0).args[0].input)).to.equal(`{"Bucket":"${bucket}","Key":"${key}"}`)
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
