import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import Page from '../models/page/page.js'
import trashPage from './trash-page.js'

describe('trashPage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
    mockReq.page = new Page({ revisions: [] })
  })

  afterEach(() => sinon.restore())

  it('marks the page as trashed', async () => {
    trashPage(mockReq, mockRes, mockNext)
    expect(mockReq.page?.trashed).to.be.an.instanceOf(Date)
  })
})
