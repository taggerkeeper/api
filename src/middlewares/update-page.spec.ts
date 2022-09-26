import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import { PermissionLevel } from '../models/permissions/data.js'
import User from '../models/user/user.js'
import Revision from '../models/revision/revision.js'
import Page from '../models/page/page.js'
import updatePage from './update-page.js'

describe('updatePage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}

  const name = 'Tester'
  const uid = '0123456789abcdef12345678'
  const editor = new User({ id: uid, name })
  const page = new Page({ revisions: [{ content: { title: 'Test Page', body: 'This is a test page.' } }] })

  const title = 'New Revision'
  const body = 'This is a new revision.'
  const msg = 'This is a commit message.'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.page = page
    mockReq.user = editor
    mockReq.revision = new Revision({ content: { title, body }, editor: editor.getObj(), msg })
    updatePage(mockReq, mockRes, mockNext)
  })

  it('updates the page', () => {
    const { page } = mockReq
    const revision = page?.revisions[0]
    expect(page).not.to.equal(undefined)
    expect(page?.revisions).to.have.lengthOf(2)
    expect(revision?.content.title).to.equal(title)
    expect(revision?.content.path).to.equal('/new-revision')
    expect(revision?.content.body).to.equal(body)
    expect(revision?.permissions.read).to.equal(PermissionLevel.anyone)
    expect(revision?.permissions.write).to.equal(PermissionLevel.anyone)
    expect(revision?.editor?.id).to.equal(uid)
    expect(revision?.msg).to.equal(msg)
  })
})
