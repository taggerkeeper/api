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
  const pid = '0123456789abcdef12345678'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    findById = sinon.stub(PageModel, 'findById')
  })

  afterEach(() => sinon.restore())

  it('does nothing if no page ID is provided', () => {
    loadPage(mockReq, mockRes, mockNext)
    expect(findById.callCount).to.equal(0)
  })

  it('loads the page identified by the page ID provided', () => {
    mockReq.params = { pid }
    loadPage(mockReq, mockRes, mockNext)
    expect(findById.callCount).to.equal(1)
    expect(findById.calledWith(pid)).to.equal(true)
  })
})
