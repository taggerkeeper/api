import { expect } from 'chai'
import * as sinon from 'sinon'
import { mockRequest, mockResponse } from 'mock-req-res'
import { PermissionLevel } from '../models/permissions/data.js'
import User from '../models/user/user.js'
import Revision from '../models/revision/revision.js'
import Page from '../models/page/page.js'
import PageModel from '../models/page/model.js'
import updatePage from './update-page.js'

describe('updatePage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()
  let stub: sinon.SinonStub

  const name = 'Tester'
  const uid = '0123456789abcdef12345678'
  const editor = new User({ id: uid, name })

  const title = 'New Revision'
  const body = 'This is a new revision.'
  const msg = 'This is a commit message.'

  const revision = new Revision({ content: { title, body }, editor: editor.getObj(), msg })

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
    stub = sinon.stub(PageModel, 'updateOne')
    mockReq.page = new Page({ id: 'abcdef0123456789abcdef01', revisions: [{ content: { title: 'Original Revision', body: 'This is the original revision.' }, msg: 'Initial text' }] })
  })

  afterEach(() => sinon.restore())

  it('updates the content if given a revision', () => {
    mockReq.revision = revision
    updatePage(mockReq, mockRes, mockNext)
    const revisions = mockReq.page?.revisions
    const zero = Array.isArray(revisions) ? revisions[0] : undefined
    expect(revisions).to.have.lengthOf(2)
    expect(zero?.content.title).to.equal(title)
    expect(zero?.content.path).to.equal('/new-revision')
    expect(zero?.content.body).to.equal(body)
    expect(zero?.permissions.read).to.equal(PermissionLevel.anyone)
    expect(zero?.permissions.write).to.equal(PermissionLevel.anyone)
    expect(zero?.editor?.id).to.equal(uid)
    expect(zero?.msg).to.equal(msg)
  })

  it('untrashes the page if it\'s trashed', () => {
    if (mockReq.page !== undefined) mockReq.page.trashed = new Date()
    updatePage(mockReq, mockRes, mockNext)
    expect(stub.args[0][1].$unset.trashed).to.equal(1)
  })
})
