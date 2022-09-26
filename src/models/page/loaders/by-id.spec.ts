import { expect } from 'chai'
import * as sinon from 'sinon'
import Page from '../page.js'
import PageModel from '../model.js'
import loadPageById from './by-id.js'

describe('loadPageById', () => {
  const id = '0123456789abcdef12345678'
  const record = { _id: id, revisions: [] }

  afterEach(() => sinon.restore())

  it('returns null if not given a valid ID', async () => {
    sinon.stub(PageModel, 'findOne').resolves(null)
    const actual = await loadPageById(id)
    expect(actual).to.equal(null)
  })

  it('returns null if given a valid ID that does not exist', async () => {
    sinon.stub(PageModel, 'findOne').resolves(null)
    const actual = await loadPageById(id)
    expect(actual).to.equal(null)
  })

  it('returns a page if given a valid, existing ID', async () => {
    sinon.stub(PageModel, 'findOne').resolves(record)
    const actual = await loadPageById(id)
    expect(actual).to.be.an.instanceOf(Page)
  })
})
