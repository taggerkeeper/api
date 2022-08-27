import { expect } from 'chai'
import parseCookie from './cookie.js'

describe('parseCookie', () => {
  it('parses the cookie name', () => {
    expect(parseCookie('name=value')?.name).to.equal('name')
  })

  it('parses the cookie value', () => {
    expect(parseCookie('name=value')?.value).to.equal('value')
  })

  it('parses the Expires crumb', () => {
    const dateStr = 'Mon, 1 Aug 2022 01:00:00 GMT'
    const date = new Date(dateStr)
    expect(parseCookie(`name=value; Expires=${dateStr}`)?.expires).to.eql(date)
  })

  it('parses the Max-Age crumb', () => {
    const maxAge = 1234567890
    expect(parseCookie(`name=value; Max-Age=${maxAge}`)?.maxAge).to.equal(maxAge)
  })

  it('parses the Domain crumb', () => {
    const domain = 'testing.com'
    expect(parseCookie(`name=value; Domain=${domain}`)?.domain).to.equal(domain)
  })

  it('parses the Path crumb', () => {
    expect(parseCookie('name=value; Path=/')?.path).to.equal('/')
  })

  it('parses the Secure crumb', () => {
    expect(parseCookie('name=value; Secure')?.secure).to.equal(true)
  })

  it('parses the HttpOnly crumb', () => {
    expect(parseCookie('name=value; HttpOnly')?.httpOnly).to.equal(true)
  })

  it('parses the SameSite crumb', () => {
    expect(parseCookie('name=value; SameSite=Strict')?.sameSite).to.equal('Strict')
  })
})
