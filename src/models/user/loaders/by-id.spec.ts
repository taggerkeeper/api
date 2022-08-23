import { expect } from 'chai'
import * as sinon from 'sinon'
import User from '../user.js'
import UserModel from '../model.js'
import loadUserById from './by-id.js'

describe('loadUserById', () => {
  const id = '0123456789abcdef12345678'
  const emails = [{ addr: 'test1@testing.com', verified: true }, { addr: 'test2@testing.com', verified: false }]
  const otp = { enabled: true, secret: 'shhhh' }
  const record = { _id: id, active: true, admin: false, password: 'hash', emails, otp }

  afterEach(() => sinon.restore())

  it('returns null if not given a valid ID', async () => {
    sinon.stub(UserModel, 'findById').resolves(null)
    const actual = await loadUserById(id)
    expect(actual).to.equal(null)
  })

  it('returns null if given a valid ID that does not exist', async () => {
    sinon.stub(UserModel, 'findById').resolves(null)
    const actual = await loadUserById(id)
    expect(actual).to.equal(null)
  })

  it('returns a user if given a valid, existing ID', async () => {
    sinon.stub(UserModel, 'findById').resolves(record)
    const actual = await loadUserById(id)
    expect(actual).to.be.an.instanceOf(User)
  })
})
