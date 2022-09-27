import chai, { expect } from 'chai'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import { PermissionLevel } from '../models/permissions/data.js'
import User from '../models/user/user.js'
import Revision from '../models/revision/revision.js'
import Page from '../models/page/page.js'
import requirePageRead from './require-page-read.js'

chai.use(sinonChai)

describe('requirePageRead', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()

  const name = 'Tester'
  const uid = '0123456789abcdef12345678'
  const editor = new User({ id: uid, name })
  const other = new User()
  const admin = new User({ id: 'abcdefabcdefabcdefabcdef', name: 'Admin', admin: true })

  const title = 'New Revision'
  const body = 'This is a new revision.'
  const msg = 'This is a commit message.'
  const content = { title, body }
  const revisions = {
    anon: { content, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }, editor: editor.getObj(), msg },
    auth: { content, permissions: { read: PermissionLevel.authenticated, write: PermissionLevel.anyone }, editor: editor.getObj(), msg },
    editor: { content, permissions: { read: PermissionLevel.editor, write: PermissionLevel.anyone }, editor: editor.getObj(), msg },
    admin: { content, permissions: { read: PermissionLevel.admin, write: PermissionLevel.anyone }, editor: editor.getObj(), msg }
  }
  const pages = {
    anon: new Page({ revisions: [revisions.anon] }),
    auth: new Page({ revisions: [revisions.auth] }),
    editor: new Page({ revisions: [revisions.editor] }),
    admin: new Page({ revisions: [revisions.admin] })
  }
  const revision = new Revision({ content: { title, body }, editor: editor.getObj(), msg })

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
    mockReq.revision = revision
    pages.anon = new Page({ revisions: [revisions.anon] })
    pages.auth = new Page({ revisions: [revisions.auth] })
    pages.editor = new Page({ revisions: [revisions.editor] })
    pages.admin = new Page({ revisions: [revisions.admin] })
  })

  describe('Pages that anyone can read', () => {
    beforeEach(() => {
      mockReq.page = pages.anon
    })

    it('allows anonymous users', () => {
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })

    it('allows authenticated users', () => {
      mockReq.user = other
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })

    it('allows editors', () => {
      mockReq.user = editor
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })

    it('allows admins', () => {
      mockReq.user = admin
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })
  })

  describe('Pages that only authenticated users can read', () => {
    beforeEach(() => {
      mockReq.page = pages.auth
    })

    it('doesn\'t allow anonymous users', () => {
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockRes.status).to.have.been.calledWith(401)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'This method requires authentication.' })
      expect(mockRes.set).to.have.been.calledWith('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    })

    it('allows authenticated users', () => {
      mockReq.user = other
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })

    it('allows editors', () => {
      mockReq.user = editor
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })

    it('allows admins', () => {
      mockReq.user = admin
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })
  })

  describe('Pages that only editors can read', () => {
    beforeEach(() => {
      mockReq.page = pages.editor
    })

    it('doesn\'t allow anonymous users', () => {
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockRes.status).to.have.been.calledWith(401)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'This method requires authentication.' })
      expect(mockRes.set).to.have.been.calledWith('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    })

    it('doesn\'t allow authenticated users', () => {
      mockReq.user = other
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockRes.status).to.have.been.calledWith(403)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'You do not have permission to view this page.' })
    })

    it('allows editors', () => {
      mockReq.user = editor
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })

    it('allows admins', () => {
      mockReq.user = admin
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })
  })

  describe('Pages that only admins can read', () => {
    beforeEach(() => {
      mockReq.page = pages.admin
    })

    it('doesn\'t allow anonymous users', () => {
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockRes.status).to.have.been.calledWith(401)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'This method requires authentication.' })
      expect(mockRes.set).to.have.been.calledWith('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    })

    it('doesn\'t allow authenticated users', () => {
      mockReq.user = other
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockRes.status).to.have.been.calledWith(403)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'You do not have permission to view this page.' })
    })

    it('doesn\'t allow editors', () => {
      mockReq.user = editor
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockRes.status).to.have.been.calledWith(403)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'You do not have permission to view this page.' })
    })

    it('allows admins', () => {
      mockReq.user = admin
      requirePageRead(mockReq, mockRes, mockNext)
      expect(mockNext).to.have.callCount(1)
    })
  })
})
