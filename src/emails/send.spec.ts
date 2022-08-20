import { expect } from 'chai'
import * as sinon from 'sinon'
import sendMail from './send.js'

describe('sendMail', () => {
  const emailTo = 'test@testing.com'
  const subject = 'Test'
  const text = 'This is only a test.'

  const client = {
    messages: { create: sinon.stub() }
  }

  beforeEach(() => {
    client.messages.create = sinon.stub()
  })

  afterEach(() => sinon.restore())

  it('sends the email', async () => {
    await sendMail(emailTo, subject, text, client)
    const obj = client.messages.create.firstCall.args[1]
    expect([emailTo, subject, text].join(' ')).to.equal([obj.to, obj.subject, obj.text].join(' '))
  })
})
