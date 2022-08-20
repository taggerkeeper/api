import { expect } from 'chai'
import getClient from './get-client.js'

describe('getClient', () => {
  it('returns a Mailgun client that can send email', () => {
    const client = getClient()
    expect(client.messages.create).to.be.a('function')
  })

  it('returns a Mailgun client that can validate an email address', () => {
    const client = getClient()
    expect(client.validate.get).to.be.a('function')
  })
})
