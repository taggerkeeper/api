import { expect } from 'chai'
import * as sinon from 'sinon'
import sendResetFail from './reset-fail.js'

describe('sendReset', () => {
  let sender = sinon.stub().resolves(true)
  beforeEach(() => { sender = sinon.stub().resolves(true) })
  afterEach(() => sinon.restore())

  it('sends a reset failure email', async () => {
    await sendResetFail('test@testing.com', '127.0.0.1', sender)
    expect(sender.firstCall.args[1]).to.equal('Password reset failed')
  })
})
