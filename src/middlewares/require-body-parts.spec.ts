import chai, { expect } from 'chai'
import { spy } from 'sinon'
import sinonChai from 'sinon-chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import requireBodyParts from './require-body-parts.js'

chai.use(sinonChai)

describe('requireBodyParts', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = spy()
  const name = 'Tester'
  const email = 'tester@testing.com'
  const password = 'test password'
  const fn = requireBodyParts('name', 'email', 'password')

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = spy()
  })

  it('returns 400 if there is no body', () => {
    fn(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
  })

  it('returns an error message if there is no body', () => {
    fn(mockReq, mockRes, mockNext)
    expect(mockRes.send).to.have.been.calledWith({ message: 'This method requires a body with elements \'name\', \'email\', and \'password\'' })
  })

  it('doesn\'t call next if there is no body', () => {
    fn(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(0)
  })

  it('returns 400 if the body doesn\'t have the required parts', () => {
    mockReq.body = { name }
    fn(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
  })

  it('returns an error message if the body doesn\'t have the required parts', () => {
    mockReq.body = { name }
    fn(mockReq, mockRes, mockNext)
    expect(mockRes.send).to.have.been.calledWith({ message: 'This method requires a body with elements \'email\' and \'password\'' })
  })

  it('doesn\'t call next if the body doesn\'t have the required parts', () => {
    mockReq.body = { name }
    fn(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(0)
  })

  it('doesn\'t set a status if the body has all of the required parts', () => {
    mockReq.body = { name, email, password }
    fn(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.callCount(0)
  })

  it('doesn\'t send anything if the body has all of the required parts', () => {
    mockReq.body = { name, email, password }
    fn(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.callCount(0)
  })

  it('calls next if the body has all of the required parts', () => {
    mockReq.body = { name, email, password }
    fn(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
