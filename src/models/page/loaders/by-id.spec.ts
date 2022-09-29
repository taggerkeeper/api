import { expect } from 'chai'
import { Model } from 'mongoose'
import * as sinon from 'sinon'
import Page from '../page.js'
import loadPageById from './by-id.js'

describe('loadPageById', () => {
  const id = '0123456789abcdef12345678'
  const record = { _id: id, revisions: [] }

  afterEach(() => sinon.restore())

  it('returns null if not given a valid ID', async () => {
    sinon.stub(Model, 'findOne').returns({ populate: sinon.stub().resolves(null) } as any)
    const actual = await loadPageById(id)
    expect(actual).to.equal(null)
  })

  it('returns null if given a valid ID that does not exist', async () => {
    sinon.stub(Model, 'findOne').returns({ populate: sinon.stub().resolves(null) } as any)
    const actual = await loadPageById(id)
    expect(actual).to.equal(null)
  })

  it('returns a page if given a valid, existing ID', async () => {
    sinon.stub(Model, 'findOne').returns({ populate: sinon.stub().resolves(record) } as any)
    const actual = await loadPageById(id)
    expect(actual).to.be.an.instanceOf(Page)
  })
})
