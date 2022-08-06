import { expect } from 'chai'
import loadPackage from './load-package.js'

describe('loadPackage', () => {
  it('returns the package data', async () => {
    const actual = await loadPackage()
    expect(actual?.name).to.equal('@taggerkeeper/api')
  })
})
