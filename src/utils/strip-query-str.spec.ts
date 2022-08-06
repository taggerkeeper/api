import { expect } from 'chai'
import stripQueryStr from './strip-query-str.js'

describe('stripQueryStr', () => {
  const base = '/path/to/item'
  const query = `${base}?param1=val1&param2=val2`

  it('returns the original string if it does not include a ?', () => {
    expect(stripQueryStr(base)).to.equal(base)
  })

  it('strips away the query string if there is one', () => {
    expect(stripQueryStr(query)).to.equal(base)
  })
})
