import { expect } from 'chai'
import { Model } from 'mongoose'
import * as sinon from 'sinon'
import Page from '../page.js'
import loadPageByPath from './by-path.js'

describe('loadPageByPath', () => {
  const id = '0123456789abcdef12345678'
  const title = 'New Page'
  const path = '/new-page'
  const body = 'This is a new page.'
  const record = { _id: id, revisions: [{ content: { title, path, body } }] }

  afterEach(() => sinon.restore())

  it('returns null if given a path that does not exist', async () => {
    sinon.stub(Model, 'findOne').returns({ populate: sinon.stub().resolves(null) } as any)
    const actual = await loadPageByPath('/nope')
    expect(actual).to.equal(null)
  })

  it('returns a page if given a valid, existing path', async () => {
    sinon.stub(Model, 'findOne').returns({ populate: sinon.stub().resolves(record) } as any)
    const actual = await loadPageByPath(path)
    expect(actual).to.be.an.instanceOf(Page)
  })
})
