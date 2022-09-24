import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import { PermissionLevel } from '../models/permissions/data.js'
import User from '../models/user/user.js'
import Revision from '../models/revision/revision.js'
import createPage from './create-page.js'

describe('createPage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}

  const name = 'Tester'
  const uid = '0123456789abcdef12345678'
  const editor = new User({ id: uid, name })

  const title = 'New Revision'
  const body = 'This is a new revision.'
  const msg = 'This is a commit message.'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.user = editor
    mockReq.revision = new Revision({ content: { title, body }, editor: editor.getObj(), msg })
    createPage(mockReq, mockRes, mockNext)
  })

  it('creates a new page', () => {
    const { page } = mockReq
    const revision = page?.revisions[0]
    expect(page).not.to.equal(undefined)
    expect(page?.revisions).to.have.lengthOf(1)
    expect(revision?.content.title).to.equal(title)
    expect(revision?.content.path).to.equal('/new-revision')
    expect(revision?.content.body).to.equal(body)
    expect(revision?.permissions.read).to.equal(PermissionLevel.anyone)
    expect(revision?.permissions.write).to.equal(PermissionLevel.anyone)
    expect(revision?.editor?.id).to.equal(uid)
    expect(revision?.msg).to.equal(msg)
  })
})
