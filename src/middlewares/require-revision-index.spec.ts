import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import Page from '../models/page/page.js'
import Revision from '../models/revision/revision.js'
import requireRevisionIndex from './require-revision-index.js'

chai.use(sinonChai)

describe('requireRevisionIndex', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const revisions = [{ content: { title: 'First', body: 'First!' } }]

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  afterEach(() => sinon.restore())

  it('returns 404 if not given a page', async () => {
    requireRevisionIndex(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(404)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: 'Page not found.' })
    expect(mockReq.revision).to.equal(undefined)
    expect(mockNext).to.have.callCount(0)
  })

  it('returns 400 if not given a revision', async () => {
    mockReq.page = new Page({ revisions })
    requireRevisionIndex(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: 'undefined is not a valid index for any revision of this page. Please provide an index between 1 and 1.' })
    expect(mockReq.revision).to.equal(undefined)
    expect(mockNext).to.have.callCount(0)
  })

  it('returns 400 if given a string for a revision', async () => {
    mockReq.page = new Page({ revisions })
    mockReq.params = { revision: 'nope' }
    requireRevisionIndex(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: 'nope is not a valid index for any revision of this page. Please provide an index between 1 and 1.' })
    expect(mockReq.revision).to.equal(undefined)
    expect(mockNext).to.have.callCount(0)
  })

  it('returns 400 if given a number less than 1 for a revision', async () => {
    mockReq.page = new Page({ revisions })
    mockReq.params = { revision: '0' }
    requireRevisionIndex(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: '0 is not a valid index for any revision of this page. Please provide an index between 1 and 1.' })
    expect(mockReq.revision).to.equal(undefined)
    expect(mockNext).to.have.callCount(0)
  })

  it('returns 400 if given a number too large to be a revision', async () => {
    mockReq.page = new Page({ revisions })
    mockReq.params = { revision: '2' }
    requireRevisionIndex(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: '2 is not a valid index for any revision of this page. Please provide an index between 1 and 1.' })
    expect(mockReq.revision).to.equal(undefined)
    expect(mockNext).to.have.callCount(0)
  })

  it('calls the next function if given a valid revision', async () => {
    mockReq.page = new Page({ revisions })
    mockReq.params = { revision: '1' }
    requireRevisionIndex(mockReq, mockRes, mockNext)
    expect(mockReq.revision).to.be.an.instanceOf(Revision)
    expect(mockNext).to.have.callCount(1)
  })
})
