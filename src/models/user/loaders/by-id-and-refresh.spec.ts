import { expect } from 'chai'
import * as sinon from 'sinon'
import User from '../user.js'
import UserModel from '../model.js'
import loadUserByIdAndRefresh from './by-id-and-refresh.js'

describe('loadUserByIdAndRefresh', () => {
  const id = '0123456789abcdef12345678'
  const refresh = 'my-refresh-token'
  const emails = [{ addr: 'test1@testing.com', verified: true }, { addr: 'test2@testing.com', verified: false }]
  const otp = { enabled: true, secret: 'shhhh' }
  const record = { _id: id, active: true, admin: false, password: 'hash', refresh, emails, otp }

  afterEach(() => sinon.restore())

  it('returns null if not given a valid ID', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)
    const actual = await loadUserByIdAndRefresh(id, refresh)
    expect(actual).to.equal(null)
  })

  it('returns null if given a valid ID and refresh combination that does not exist', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)
    const actual = await loadUserByIdAndRefresh(id, refresh)
    expect(actual).to.equal(null)
  })

  it('returns a user if given a valid, existing ID and refresh combination', async () => {
    sinon.stub(UserModel, 'findOne').resolves(record)
    const actual = await loadUserByIdAndRefresh(id, refresh)
    expect(actual).to.be.an.instanceOf(User)
  })
})
