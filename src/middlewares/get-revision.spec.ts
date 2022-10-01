import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import Page from '../models/page/page.js'
import getRevision from './get-revision.js'

describe('getRevision', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}

  const revisions = [
    { content: { title: 'Revision 3', path: '/rev3', body: 'This is the third revision.' } },
    { content: { title: 'Revision 2', path: '/rev2', body: 'This is the second revision.' } },
    { content: { title: 'Revision 1', path: '/rev1', body: 'This is the original revision.' } }
  ]

  const page = new Page({ revisions })

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.page = page
  })

  it('sets the revision indicated', () => {
    mockReq.params = { revision: '2' }
    getRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision?.content.title).to.equal('Revision 2')
    expect(revision?.content.path).to.equal('/rev2')
    expect(revision?.content.body).to.equal('This is the second revision.')
  })

  it('does nothing if no such revision exists', () => {
    mockReq.params = { revision: '4' }
    getRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision).to.equal(undefined)
  })

  it('does nothing if not given a number', () => {
    mockReq.params = { revision: 'three' }
    getRevision(mockReq, mockRes, mockNext)
    const { revision } = mockReq
    expect(revision).to.equal(undefined)
  })
})
