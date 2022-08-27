import { expect } from 'chai'
import parseKeyValPair from './key-val.js'

describe('parseKeyValPair', () => {
  it('returns null if there\'s no key/value pair to parse', () => {
    expect(parseKeyValPair('nope')).to.equal(null)
  })

  it('captures the key and value', () => {
    const pair = parseKeyValPair('test=yes')
    expect(pair?.test).to.equal('yes')
  })

  it('handles awkward spaces', () => {
    const pair = parseKeyValPair('   test  =    yes     ')
    expect(pair?.test).to.equal('yes')
  })

  it('handles straight double quotes', () => {
    const pair = parseKeyValPair('test="yes"')
    expect(pair?.test).to.equal('yes')
  })

  it('handles straight single quotes', () => {
    const pair = parseKeyValPair('test=\'yes\'')
    expect(pair?.test).to.equal('yes')
  })

  it('handles curly double quotes', () => {
    const pair = parseKeyValPair('test=“yes”')
    expect(pair?.test).to.equal('yes')
  })

  it('handles curly single quotes', () => {
    const pair = parseKeyValPair('test=‘yes’')
    expect(pair?.test).to.equal('yes')
  })

  it('can return as a uniform object', () => {
    const pair = parseKeyValPair('test=‘yes’', false)
    expect(pair?.key).to.equal('test')
    expect(pair?.value).to.equal('yes')
  })
})
