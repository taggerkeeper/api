import { expect } from 'chai'
import getClient from './get-client.js'

describe('getClient', () => {
  it('returns a Mailgun client', () => {
    const client = getClient()
    expect(client.messages.create).to.be.a('function')
  })
})
