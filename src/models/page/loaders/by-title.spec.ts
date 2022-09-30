import { expect } from 'chai'
import { Model } from 'mongoose'
import * as sinon from 'sinon'
import Page from '../page.js'
import loadPageByTitle from './by-title.js'

describe('loadPageByTitle', () => {
  const id = '0123456789abcdef12345678'
  const title = 'New Page'
  const path = '/new-page'
  const body = 'This is a new page.'
  const record = { _id: id, revisions: [{ content: { title, path, body } }] }

  afterEach(() => sinon.restore())

  it('returns null if given a path that does not exist', async () => {
    sinon.stub(Model, 'findOne').returns({ populate: sinon.stub().resolves(null) } as any)
    const actual = await loadPageByTitle('Nope')
    expect(actual).to.equal(null)
  })

  it('returns a page if given a valid, existing title', async () => {
    sinon.stub(Model, 'findOne').returns({ populate: sinon.stub().resolves(record) } as any)
    const actual = await loadPageByTitle(path)
    expect(actual).to.be.an.instanceOf(Page)
  })

  it('returns the oldest page with the title', async () => {
    const stub = sinon.stub(Model, 'findOne').returns({ populate: sinon.stub().resolves(record) } as any)
    await loadPageByTitle(path)
    expect((stub.args[0] as any)[2].sort.created).to.equal(1)
  })
})
