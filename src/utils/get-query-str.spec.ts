import { expect } from 'chai'
import getQueryStr from './get-query-str.js'

describe('getQueryStr', () => {
  it('translates an object into a query string', () => {
    const obj = { a: 'Hello, world!', b: 42, c: false }
    const expected = 'a=Hello%2C%20world!&b=42&c=false'
    expect(getQueryStr(obj)).to.equal(expected)
  })
})
