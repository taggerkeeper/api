import { expect } from 'chai'
import readFile from './read-file.js'

describe('readFile', () => {
  it('reads a file into a string', () => {
    const actual = readFile('../../LICENSE')
    expect(typeof actual).to.equal('string')
  })
})
