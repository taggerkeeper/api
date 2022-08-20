import { expect } from 'chai'
import * as sinon from 'sinon'
import Email from '../models/email/email.js'
import sendVerification from './verify.js'

describe('sendVerification', () => {
  let sender = sinon.stub().resolves(true)
  beforeEach(() => { sender = sinon.stub().resolves(true) })
  afterEach(() => sinon.restore())

  it('sends a verification email', async () => {
    const email = new Email({ addr: 'test@testing.com' })
    await sendVerification(email, '127.0.0.1', sender)
    expect(sender.firstCall.args[1]).to.equal('Can you verify this email address?')
  })
})
