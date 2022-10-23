import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import Revision from '../models/revision/revision.js'
import addFilesToRevision from './add-files-to-revision.js'

describe('addFilesToRevision', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()
  const data = {
    revision: { content: { title: 'New Revision', body: 'This is a test.' } },
    file: { location: '/path/to/file.txt', key: 'file.txt', contentType: 'text/plain', size: 12345 } as Express.MulterS3.File,
    thumbnail: { location: '/path/to/thumbnail.jpg', key: 'thumbnail.jpg', contentType: 'image/jpeg', size: 12345 } as Express.MulterS3.File
  }

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  afterEach(() => sinon.restore())

  const isFile = (file: any, src: Express.MulterS3.File): void => {
    expect(file?.location).to.equal(src.location)
    expect(file?.key).to.equal(src.key)
    expect(file?.mime).to.equal(src.contentType)
    expect(file?.size).to.equal(src.size)
  }

  it('does nothing if there is no revision', () => {
    addFilesToRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision).to.equal(undefined)
    expect(revision?.file).to.equal(undefined)
    expect(revision?.thumbnail).to.equal(undefined)
    expect(mockNext.callCount).to.equal(1)
  })

  it('does nothing if there are no files', () => {
    mockReq.revision = new Revision(data.revision)
    addFilesToRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision).to.be.an.instanceOf(Revision)
    expect(revision?.file).to.equal(undefined)
    expect(revision?.thumbnail).to.equal(undefined)
    expect(mockNext.callCount).to.equal(1)
  })

  it('adds a file if there\'s a file to add', () => {
    mockReq.revision = new Revision(data.revision)
    mockReq.files = { file: [data.file] }
    addFilesToRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision).to.be.an.instanceOf(Revision)
    isFile(revision?.file, data.file)
    expect(revision?.thumbnail).to.equal(undefined)
    expect(mockNext.callCount).to.equal(1)
  })

  it('adds a thumbnail if there\'s a thumbnail to add', () => {
    mockReq.revision = new Revision(data.revision)
    mockReq.files = { thumbnail: [data.thumbnail] }
    addFilesToRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision).to.be.an.instanceOf(Revision)
    expect(revision?.file).to.equal(undefined)
    isFile(revision?.thumbnail, data.thumbnail)
    expect(mockNext.callCount).to.equal(1)
  })

  it('adds both if both are present', () => {
    mockReq.revision = new Revision(data.revision)
    mockReq.files = { file: [data.file], thumbnail: [data.thumbnail] }
    addFilesToRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision).to.be.an.instanceOf(Revision)
    isFile(revision?.file, data.file)
    isFile(revision?.thumbnail, data.thumbnail)
    expect(mockNext.callCount).to.equal(1)
  })
})
