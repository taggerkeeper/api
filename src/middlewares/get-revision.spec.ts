import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import Page from '../models/page/page.js'
import getRevision from './get-revision.js'

chai.use(sinonChai)

describe('getRevision', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()

  const revisions = [
    { content: { title: 'Revision 3', path: '/rev3', body: 'This is the third revision.' } },
    { content: { title: 'Revision 2', path: '/rev2', body: 'This is the second revision.' } },
    { content: { title: 'Revision 1', path: '/rev1', body: 'This is the original revision.' } }
  ]

  const page = new Page({ revisions })

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
    mockReq.page = page
  })

  afterEach(() => sinon.restore())

  it('sets the revision indicated', () => {
    mockReq.params = { revision: '2' }
    getRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision?.content.title).to.equal('Revision 2')
    expect(revision?.content.path).to.equal('/rev2')
    expect(revision?.content.body).to.equal('This is the second revision.')
  })

  it('returns an error if no such revision exists', () => {
    mockReq.params = { revision: '4' }
    getRevision(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: '4 is not a valid index for any revision of this page. Please provide an index between 1 and 3.' })
  })

  it('returns an error if not given a number', () => {
    mockReq.params = { revision: 'lolnope' }
    getRevision(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: 'lolnope is not a valid index for any revision of this page. Please provide an index between 1 and 3.' })
  })
})
