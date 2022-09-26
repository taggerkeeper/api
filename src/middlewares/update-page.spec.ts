import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import { PermissionLevel } from '../models/permissions/data.js'
import User from '../models/user/user.js'
import Revision from '../models/revision/revision.js'
import Page from '../models/page/page.js'
import updatePage from './update-page.js'

chai.use(sinonChai)

describe('updatePage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}

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
    auth: { content, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.authenticated }, editor: editor.getObj(), msg },
    editor: { content, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.editor }, editor: editor.getObj(), msg },
    admin: { content, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.admin }, editor: editor.getObj(), msg }
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
    mockNext = () => {}
    mockReq.revision = revision
    pages.anon = new Page({ revisions: [revisions.anon] })
    pages.auth = new Page({ revisions: [revisions.auth] })
    pages.editor = new Page({ revisions: [revisions.editor] })
    pages.admin = new Page({ revisions: [revisions.admin] })
  })

  describe('Updating content', () => {
    it('updates the content', () => {
      mockReq.page = pages.anon
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page.revisions).to.have.lengthOf(2)
      expect(mockReq.page.revisions[0].content.title).to.equal(title)
      expect(mockReq.page.revisions[0].content.path).to.equal('/new-revision')
      expect(mockReq.page.revisions[0].content.body).to.equal(body)
      expect(mockReq.page.revisions[0].permissions.read).to.equal(PermissionLevel.anyone)
      expect(mockReq.page.revisions[0].permissions.write).to.equal(PermissionLevel.anyone)
      expect(mockReq.page.revisions[0].editor?.id).to.equal(uid)
      expect(mockReq.page.revisions[0].msg).to.equal(msg)
    })
  })

  describe('Pages that anyone can update', () => {
    beforeEach(() => {
      mockReq.page = pages.anon
    })

    it('lets anonymous users update', () => {
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })

    it('lets authenticated users update', () => {
      mockReq.user = other
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })

    it('lets editors update', () => {
      mockReq.user = editor
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })

    it('lets admins update', () => {
      mockReq.user = admin
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })
  })

  describe('Pages that only authenticated users can update', () => {
    beforeEach(() => {
      mockReq.page = pages.auth
    })

    it('doesn\'t let anonymous users update', () => {
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(1)
      expect(mockRes.status).to.have.been.calledWith(401)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'This method requires authentication.' })
      expect(mockRes.set).to.have.been.calledWith('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    })

    it('lets authenticated users update', () => {
      mockReq.user = other
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })

    it('lets editors update', () => {
      mockReq.user = editor
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })

    it('lets admins update', () => {
      mockReq.user = admin
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })
  })

  describe('Pages that only editors can update', () => {
    beforeEach(() => {
      mockReq.page = pages.editor
    })

    it('doesn\'t let anonymous users update', () => {
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(1)
      expect(mockRes.status).to.have.been.calledWith(401)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'This method requires authentication.' })
      expect(mockRes.set).to.have.been.calledWith('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    })

    it('doesn\'t let authenticated users update', () => {
      mockReq.user = other
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(1)
      expect(mockRes.status).to.have.been.calledWith(403)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'You do not have permission to update this page.' })
    })

    it('lets editors update', () => {
      mockReq.user = editor
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })

    it('lets admins update', () => {
      mockReq.user = admin
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })
  })

  describe('Pages that only admins can update', () => {
    beforeEach(() => {
      mockReq.page = pages.admin
    })

    it('doesn\'t let anonymous users update', () => {
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(1)
      expect(mockRes.status).to.have.been.calledWith(401)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'This method requires authentication.' })
      expect(mockRes.set).to.have.been.calledWith('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    })

    it('doesn\'t let authenticated users update', () => {
      mockReq.user = other
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(1)
      expect(mockRes.status).to.have.been.calledWith(403)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'You do not have permission to update this page.' })
    })

    it('doesn\'t let editors update', () => {
      mockReq.user = editor
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(1)
      expect(mockRes.status).to.have.been.calledWith(403)
      expect(mockRes.send).to.have.been.calledWithMatch({ message: 'You do not have permission to update this page.' })
    })

    it('lets admins update', () => {
      mockReq.user = admin
      updatePage(mockReq, mockRes, mockNext)
      expect(mockReq.page?.revisions).to.have.lengthOf(2)
    })
  })
})
