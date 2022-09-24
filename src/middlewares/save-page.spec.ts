import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import Page from '../models/page/page.js'
import savePage from './save-page.js'

describe('savePage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let save: sinon.SinonStub

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.page = new Page({ revisions: [] })
    save = sinon.stub(Page.prototype, 'save')
    savePage(mockReq, mockRes, mockNext)
  })

  afterEach(() => sinon.restore())

  it('saves the request page', () => {
    expect(save.callCount).to.equal(1)
  })
})
