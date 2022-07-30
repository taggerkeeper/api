import chai, { expect } from 'chai'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import PasswordReset from '../password-reset.js'
import PasswordResetModel from '../model.js'
import loadPasswordResetByEmailAndCode from './by-email-and-code.js'

chai.use(sinonChai)

describe('loadPasswordResetByEmailAndCode', () => {
  const addr = 'test@testing.com'
  const record = {
    user: {
      _id: '0123456789abcdef12345678',
      active: true,
      admin: false,
      password: 'hash',
      emails: [
        { addr, verified: true, code: 'email-verification-code' }
      ],
      otp: { enabled: false, secret: 'shhhhh' }
    },
    email: { addr, verified: true, code: 'email-verification-code' },
    code: 'abc123',
    expiration: new Date()
  }

  afterEach(() => sinon.restore())

  it('searches by name and code', async () => {
    const stub = sinon.stub(PasswordResetModel, 'findOne').returns({
      populate: sinon.stub().callsFake((query: any) => new Promise(resolve => resolve(null)))
    } as any)
    const actual = await loadPasswordResetByEmailAndCode(addr, record.code)
    expect(stub).to.have.been.calledWithMatch({ 'email.addr': addr, code: record.code })
  })

  it('returns null if the query returns null', async () => {
    sinon.stub(PasswordResetModel, 'findOne').returns({
      populate: sinon.stub().callsFake((query: any) => new Promise(resolve => resolve(null)))
    } as any)
    const actual = await loadPasswordResetByEmailAndCode(addr, record.code)
    expect(actual).to.equal(null)
  })

  it('returns a PasswordReset if the query returns a record', async () => {
    sinon.stub(PasswordResetModel, 'findOne').returns({
      populate: sinon.stub().callsFake((query: any) => new Promise(resolve => resolve(record)))
    } as any)
    const actual = await loadPasswordResetByEmailAndCode(addr, record.code)
    expect(actual).to.be.an.instanceOf(PasswordReset)
  })
})