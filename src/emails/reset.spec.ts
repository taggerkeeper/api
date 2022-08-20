import { expect } from 'chai'
import * as sinon from 'sinon'
import Email from '../models/email/email.js'
import User from '../models/user/user.js'
import PasswordReset from '../models/password-reset/password-reset.js'
import sendReset from './reset.js'

describe('sendReset', () => {
  let sender = sinon.stub().resolves(true)
  beforeEach(() => { sender = sinon.stub().resolves(true) })
  afterEach(() => sinon.restore())

  it('sends a reset email', async () => {
    const user = new User()
    const email = new Email({ addr: 'test@testing.com', verified: true })
    const reset = new PasswordReset({ user: user.getObj(), email: email.getObj() })
    await sendReset(reset, '127.0.0.1', sender)
    expect(sender.firstCall.args[1]).to.equal('Reset your password')
  })
})
