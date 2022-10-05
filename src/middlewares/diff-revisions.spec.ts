import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import Page from '../models/page/page.js'
import { PermissionLevel } from '../models/permissions/data.js'
import Revision from '../models/revision/revision.js'
import diffRevisions from './diff-revisions.js'

describe('diffRevisions', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const now = new Date().getTime()
  const a = new Revision({ content: { title: 'A', path: '/a', body: 'This is A.' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }, timestamp: new Date(now - 5) })
  const b = new Revision({ content: { title: 'B', path: '/b', body: 'This is B.' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.editor }, timestamp: new Date(now - 3) })

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.page = new Page({ revisions: [b, a] })
  })

  it('does nothing if not given a parameter index', () => {
    mockReq.query = { compare: '1' }
    diffRevisions(mockReq, mockRes, mockNext)
    expect(mockReq.revisionsDiff).to.equal(undefined)
  })

  it('does nothing if the parameter index isn\'t a number', () => {
    mockReq.query = { compare: '1' }
    mockReq.params = { revision: 'nope' }
    diffRevisions(mockReq, mockRes, mockNext)
    expect(mockReq.revisionsDiff).to.equal(undefined)
  })

  it('does nothing if the parameter index is out of bounds', () => {
    mockReq.query = { compare: '1' }
    mockReq.params = { revision: '5' }
    diffRevisions(mockReq, mockRes, mockNext)
    expect(mockReq.revisionsDiff).to.equal(undefined)
  })

  it('does nothing if not given a query index', () => {
    mockReq.params = { revision: '2' }
    diffRevisions(mockReq, mockRes, mockNext)
    expect(mockReq.revisionsDiff).to.equal(undefined)
  })

  it('does nothing if the query index isn\'t a number', () => {
    mockReq.query = { compare: 'nope' }
    mockReq.params = { revision: '2' }
    diffRevisions(mockReq, mockRes, mockNext)
    expect(mockReq.revisionsDiff).to.equal(undefined)
  })

  it('does nothing if the query index is out of bounds', () => {
    mockReq.query = { compare: '5' }
    mockReq.params = { revision: '2' }
    diffRevisions(mockReq, mockRes, mockNext)
    expect(mockReq.revisionsDiff).to.equal(undefined)
  })

  it('returns a diff of the two revisions given', () => {
    mockReq.query = { compare: '2' }
    mockReq.revision = b
    diffRevisions(mockReq, mockRes, mockNext)

    const expected = JSON.stringify({
      content: {
        title: [
          { count: 1, added: undefined, removed: true, value: 'A' },
          { count: 1, added: true, removed: undefined, value: 'B' }
        ],
        path: [
          { count: 1, value: '/' },
          { count: 1, added: undefined, removed: true, value: 'a' },
          { count: 1, added: true, removed: undefined, value: 'b' }
        ],
        body: [
          { count: 4, value: 'This is ' },
          { count: 1, added: undefined, removed: true, value: 'A' },
          { count: 1, added: true, removed: undefined, value: 'B' },
          { count: 1, value: '.' }
        ]
      },
      permissions: {
        read: [
          { value: 'anyone', count: 1 }
        ],
        write: [
          { count: 1, added: undefined, removed: true, value: 'anyone' },
          { count: 1, added: true, removed: undefined, value: 'editor' }
        ]
      }
    })

    expect(JSON.stringify(mockReq.revisionsDiff)).to.equal(expected)
  })
})
