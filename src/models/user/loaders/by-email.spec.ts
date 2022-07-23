import { expect } from 'chai'
import * as sinon from 'sinon'
import { Query } from 'mongoose'
import UserModel from '../model.js'
import loadUsersByEmail from './by-email.js'

describe('loadUsersByEmail', () => {
  const addr = 'test1@testing.com'
  const stub = sinon.stub(UserModel, 'find')

  afterEach(() => sinon.resetHistory())

  it('returns an array', async () => {
    stub.callsFake((): any => {
      return new Promise(resolve => resolve([]))
    })
    const actual = await loadUsersByEmail(addr)
    expect(Array.isArray(actual)).to.equal(true)
  })

  it('throws out records that don\'t have the given email address', async () => {
    stub.callsFake((): any => {
      return new Promise(resolve => resolve([
        { _id: 'testA', active: true, admin: false, password: 'hash', emails: [], otp: { enabled: false } }
      ]))
    })
    const actual = await loadUsersByEmail(addr)
    expect(actual).to.have.lengthOf(0)
  })

  it('throws out records for which the given email address is not verified', async () => {
    stub.callsFake((): any => {
      return new Promise(resolve => resolve([
        { _id: 'testA', active: true, admin: false, password: 'hash', emails: [{ addr, verified: false }], otp: { enabled: false } }
      ]))
    })
    const actual = await loadUsersByEmail(addr)
    expect(actual).to.have.lengthOf(0)
  })

  it('returns users who have verified the given email address', async () => {
    stub.callsFake((): any => {
      return new Promise(resolve => resolve([
        { _id: 'testA', active: true, admin: false, password: 'hash', emails: [{ addr, verified: true }], otp: { enabled: false } }
      ]))
    })
    const actual = await loadUsersByEmail(addr)
    expect(actual).to.have.lengthOf(1)
  })
})