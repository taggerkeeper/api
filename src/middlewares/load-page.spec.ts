import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import PageModel from '../models/page/model.js'
import loadPage from './load-page.js'

describe('loadPage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let findById: sinon.SinonStub
  let findOne: sinon.SinonStub
  const pid = '0123456789abcdef12345678'
  const path = '/path/to/page'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    findById = sinon.stub(PageModel, 'findById')
    findOne = sinon.stub(PageModel, 'findOne')
  })

  afterEach(() => sinon.restore())

  it('does nothing if no page ID or path is provided', () => {
    loadPage(mockReq, mockRes, mockNext)
    expect(findById.callCount).to.equal(0)
  })

  it('loads the page identified by the page ID provided', () => {
    mockReq.originalUrl = `/pages/${pid}`
    mockReq.params = { pid }
    loadPage(mockReq, mockRes, mockNext)
    expect(findById.callCount).to.equal(1)
    expect(findById.calledWith(pid)).to.equal(true)
  })

  it('loads the page identified by the path provided', () => {
    mockReq.originalUrl = `/pages${path}?q=test&n=42`
    loadPage(mockReq, mockRes, mockNext)
    expect(findOne.callCount).to.equal(1)
  })
})
