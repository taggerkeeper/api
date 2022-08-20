import chai, { expect } from 'chai'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import sendMail from './send.js'

chai.use(sinonChai)

describe('sendMail', () => {
  const emailTo = 'test@testing.com'
  const subject = 'Test'
  const text = 'This is only a test.'

  const client = {
    messages: { create: sinon.stub() },
    validate: { get: sinon.stub().resolves({ is_valid: true }) }
  }

  beforeEach(() => {
    client.messages.create = sinon.stub()
    client.validate.get = sinon.stub().resolves({ is_valid: true })
  })

  afterEach(() => sinon.restore())

  it('validates the email address first', async () => {
    await sendMail(emailTo, subject, text, client)
    expect(client.validate.get).to.have.been.calledBefore(client.messages.create)
  })

  it('sends the email', async () => {
    await sendMail(emailTo, subject, text, client)
    const obj = client.messages.create.firstCall.args[1]
    expect([emailTo, subject, text].join(' ')).to.equal([obj.to, obj.subject, obj.text].join(' '))
  })
})
