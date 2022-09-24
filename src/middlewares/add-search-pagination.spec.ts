import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import Page from '../models/page/page.js'
import checkAll from '../utils/check-all.js'
import addSearchPagination from './add-search-pagination.js'

describe('addSearchPagination', () => {
  const total = 10
  const title = 'Test Page'
  const body = 'This is a test.'
  const path = '/test'
  const pages: Page[] = []

  for (let i = 1; i <= total; i++) {
    const content = { title: `${title} #${i}`, path: `${path}-${i}`, body }
    const page = new Page({ revisions: [{ content }] })
    pages.push(page)
  }

  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = (): void => {}
  })

  const getLinks = (spy: sinon.SinonSpy): string[] => {
    const links = spy.args[0][1].split(',').map((link: string) => link.trim())
    return links.map((link: string) => {
      const match = link.match(/<(.*?)>/i)
      return match !== null ? match[1] : null
    }).filter((url: string) => url !== null)
  }

  const getRels = (spy: sinon.SinonSpy): string[] => {
    const links = spy.args[0][1].split(',').map((link: string) => link.trim())
    return links.map((link: string) => {
      const match = link.match(/rel="(.*?)"/i)
      return match !== null ? match[1] : null
    }).filter((rel: string) => rel !== null)
  }

  it('doesn\'t link to the first page if this is the first page', async () => {
    mockReq.searchResults = { total, start: 0, end: 2, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const links = getRels(mockRes.set)
    expect(links).not.to.include('first')
  })

  it('links to the first page if this isn\'t it', async () => {
    mockReq.searchResults = { total, start: 4, end: 6, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const links = getRels(mockRes.set)
    expect(links).to.include('first')
  })

  it('doesn\'t link to the previous page if there isn\'t one', async () => {
    mockReq.searchResults = { total, start: 1, end: 3, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const links = getRels(mockRes.set)
    expect(links).not.to.include('previous')
  })

  it('links to the previous page if there is one', async () => {
    mockReq.searchResults = { total, start: 4, end: 6, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const links = getRels(mockRes.set)
    expect(links).to.include('previous')
  })

  it('doesn\'t link to the next page if there isn\'t one', async () => {
    mockReq.searchResults = { total, start: 9, end: 11, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const links = getRels(mockRes.set)
    expect(links).not.to.include('next')
  })

  it('links to the next page if there is one', async () => {
    mockReq.searchResults = { total, start: 4, end: 6, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const links = getRels(mockRes.set)
    expect(links).to.include('next')
  })

  it('doesn\'t link to the last page if this is it', async () => {
    mockReq.searchResults = { total, start: 9, end: 11, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const links = getRels(mockRes.set)
    expect(links).not.to.include('last')
  })

  it('links to the last page if this isn\'t it', async () => {
    mockReq.searchResults = { total, start: 4, end: 6, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const links = getRels(mockRes.set)
    expect(links).to.include('last')
  })

  it('includes other query params in links', async () => {
    mockReq.query = { other: 'test' }
    mockReq.searchResults = { total, start: 4, end: 6, pages }
    await addSearchPagination(mockReq, mockRes, mockNext)
    const checks = getLinks(mockRes.set).map(link => link.includes('other=test'))
    expect(checkAll(checks)).to.equal(true)
  })
})
