import { expect } from 'chai'
import renderStrVars from './render-str-vars.js'

describe('renderStrVars', () => {
  it('renders variables in string', () => {
    const data = { a: 'Alice', b: 'Bob', c: 'Carol' }
    const tpl = 'Good morning, [A], [B], and [C]! How are you today, [A], [B], and [C]?'
    const expected = 'Good morning, Alice, Bob, and Carol! How are you today, Alice, Bob, and Carol?'
    const actual = renderStrVars(tpl, data)
    expect(actual).to.equal(expected)
  })

  it('leaves variables not in the dictionary untouched', () => {
    const data = { val: 42 }
    const tpl = 'Good morning, [NAME]! The answer is [VAL]!'
    const expected = 'Good morning, [NAME]! The answer is 42!'
    const actual = renderStrVars(tpl, data)
    expect(actual).to.equal(expected)
  })
})
