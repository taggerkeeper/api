import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import { Model } from 'mongoose'
import * as sinon from 'sinon'
import loadPackage from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'
import loadPage from './load-page.js'

describe('loadPage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let findOne: sinon.SinonStub
  const pid = '0123456789abcdef12345678'
  const path = '/path/to/page'
  const record = { id: pid, revisions: [{ content: { title: 'Hello, World!', path, body: 'This is a test.' } }] }
  let base: string

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    findOne = sinon.stub(Model, 'findOne')

    const pkg = await loadPackage()
    const info = await getAPIInfo(pkg)
    base = info.base
  })

  afterEach(() => sinon.restore())

  it('does nothing if no page ID or path is provided', async () => {
    findOne.returns({ populate: sinon.stub().resolves(null) })
    await loadPage(mockReq, mockRes, mockNext)
    expect(mockReq.page).to.equal(undefined)
  })

  it('loads the page identified by the page ID provided', async () => {
    findOne.returns({ populate: sinon.stub().resolves(record) })
    mockReq.originalUrl = `${base}/pages/${pid}`
    mockReq.params = { pid }
    await loadPage(mockReq, mockRes, mockNext)
    expect(mockReq.page?.id).to.equal(pid)
  })

  it('loads the page identified by the path provided', async () => {
    findOne.returns({ populate: sinon.stub().resolves(record) })
    mockReq.originalUrl = `${base}/pages${path}?q=test&n=42`
    await loadPage(mockReq, mockRes, mockNext)
    expect(mockReq.page?.id).to.equal(pid)
  })
})
