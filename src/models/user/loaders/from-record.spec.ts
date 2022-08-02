import { expect } from 'chai'
import User from '../user.js'
import UserData from '../data.js'
import OTP from '../../otp/otp.js'
import Password from '../../password/password.js'
import loadUserFromRecord from './from-record.js'

describe('loadUserFromRecord', () => {
  const emails = [{ addr: 'test1@testing.com', verified: true }, { addr: 'test2@testing.com', verified: false }]
  const otp = { enabled: true, secret: 'shhhh' }
  const record: UserData = { _id: 'abc123', active: true, admin: false, password: 'hash', emails, otp }

  it('returns null if not given a proper record', () => {
    const actual = loadUserFromRecord(null)
    expect(actual).to.equal(null)
  })

  it('returns a user if given a record', () => {
    const actual = loadUserFromRecord(record)
    expect(actual).to.be.an.instanceOf(User)
  })

  it('sets the user\'s ID', () => {
    const actual = loadUserFromRecord(record)
    expect(actual?.id).to.equal(record._id)
  })

  it('sets the user\'s active status', () => {
    const actual = loadUserFromRecord(record)
    expect(actual?.active).to.equal(true)
  })

  it('sets the user\'s admin status', () => {
    const actual = loadUserFromRecord(record)
    expect(actual?.admin).to.equal(false)
  })

  it('sets the user\'s Password object', () => {
    const actual = loadUserFromRecord(record)
    expect(actual?.password).to.be.an.instanceOf(Password)
  })

  it('sets the user\'s password hash', () => {
    const actual = loadUserFromRecord(record)
    expect(actual?.password.hash).to.equal(record.password)
  })

  it('loads the user\'s emails as Email objects', () => {
    const user = loadUserFromRecord(record)
    const actual = user?.emails.map(obj => obj.constructor.name)
    expect(actual).to.eql(['Email', 'Email'])
  })

  it('loads the user\'s email addresses', () => {
    const user = loadUserFromRecord(record)
    const actual = user?.emails.map(obj => obj.addr)
    const expected = emails.map(obj => obj.addr)
    expect(actual).to.eql(expected)
  })

  it('loads the user\'s email verification statuses', () => {
    const user = loadUserFromRecord(record)
    const actual = user?.emails.map(obj => obj.verified)
    const expected = emails.map(obj => obj.verified)
    expect(actual).to.eql(expected)
  })

  it('sets the user\'s OTP object', () => {
    const actual = loadUserFromRecord(record)
    expect(actual?.otp).to.be.an.instanceOf(OTP)
  })

  it('sets the user\'s OTP enabled flag', () => {
    const actual = loadUserFromRecord(record)
    expect(actual?.otp.enabled).to.equal(otp.enabled)
  })

  it('sets the user\'s OTP secret', () => {
    const actual = loadUserFromRecord(record)
    expect(actual?.otp.secret).to.equal(otp.secret)
  })
})
