import chai, { expect } from 'chai'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import sendMail from './send.js'

chai.use(sinonChai)

describe('sendMail', () => {
  const emailTo = 'test@testing.com'
  const subject = 'Test'
  const text = 'This is only a test.'

  const fns = {
    emailer: sinon.stub(),
    validator: sinon.stub().resolves({ is_valid: true })
  }

  beforeEach(() => {
    fns.emailer = sinon.stub()
    fns.validator = sinon.stub().resolves({ is_valid: true })
  })

  afterEach(() => sinon.restore())

  it('validates the email address first', async () => {
    await sendMail(emailTo, subject, text, fns)
    expect(fns.validator).to.have.been.calledBefore(fns.emailer)
  })

  it('sends the email', async () => {
    await sendMail(emailTo, subject, text, fns)
    const obj = fns.emailer.firstCall.args[1]
    expect([ emailTo, subject, text ].join(' ')).to.equal([ obj.to, obj.subject, obj.text].join(' '))
  })
})
