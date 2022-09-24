import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import { PermissionLevel } from '../models/permissions/data.js'
import User from '../models/user/user.js'
import getRevisionFromBody from './get-revision-from-body.js'

describe('getRevisionFromBody', () => {
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
    mockReq.body = { title, body, msg, 'write-permissions': PermissionLevel.authenticated }
    getRevisionFromBody(mockReq, mockRes, mockNext)
  })

  it('creates a new revision', () => {
    const { revision } = mockReq
    expect(revision?.content.title).to.equal(title)
    expect(revision?.content.path).to.equal('/new-revision')
    expect(revision?.content.body).to.equal(body)
    expect(revision?.permissions.read).to.equal(PermissionLevel.anyone)
    expect(revision?.permissions.write).to.equal(PermissionLevel.authenticated)
    expect(revision?.editor?.id).to.equal(uid)
    expect(revision?.msg).to.equal(msg)
  })
})
