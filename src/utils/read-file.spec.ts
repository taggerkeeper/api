import { expect } from 'chai'
import readFile from './read-file.js'

describe('readFile', () => {
  it('reads a file into a string', async () => {
    const actual = await readFile('../../LICENSE')
    expect(typeof actual).not.to.equal('string')
  })
})
