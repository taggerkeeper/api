import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import PageModel from '../models/page/model.js'
import loadPage from './load-page.js'

describe('loadPage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let findOne: sinon.SinonStub
  const pid = '0123456789abcdef12345678'
  const path = '/path/to/page'
  const record = { id: pid, revisions: [{ content: { title: 'Hello, World!', path, body: 'This is a test.' } }] }

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    findOne = sinon.stub(PageModel, 'findOne')
  })

  afterEach(() => sinon.restore())

  it('does nothing if no page ID or path is provided', async () => {
    await loadPage(mockReq, mockRes, mockNext)
    expect(mockReq.page).to.equal(undefined)
  })

  it('loads the page identified by the page ID provided', async () => {
    findOne.resolves(record)
    mockReq.originalUrl = `/pages/${pid}`
    mockReq.params = { pid }
    await loadPage(mockReq, mockRes, mockNext)
    expect(mockReq.page?.id).to.equal(pid)
  })

  it('loads the page identified by the path provided', async () => {
    findOne.resolves(record)
    mockReq.originalUrl = `/pages${path}?q=test&n=42`
    await loadPage(mockReq, mockRes, mockNext)
    expect(mockReq.page?.id).to.equal(pid)
  })
})
