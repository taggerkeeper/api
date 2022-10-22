import { expect } from 'chai'
import getFilename from './get-filename.js'

describe('getFilename', () => {
  it('handles basic filenames', () => {
    const actual = getFilename('test.txt')
    expect(actual.base).to.equal('test')
    expect(actual.ext).to.equal('txt')
  })

  it('handles filenames with several parts', () => {
    const actual = getFilename('test.final.final.nofrthistime.txt')
    expect(actual.base).to.equal('test.final.final.nofrthistime')
    expect(actual.ext).to.equal('txt')
  })

  it('handles filenames with no extension', () => {
    const actual = getFilename('test')
    expect(actual.base).to.equal('test')
    expect(actual.ext).to.equal('')
  })

  it('handles simple relative paths', () => {
    const actual = getFilename('./test.txt')
    expect(actual.base).to.equal('test')
    expect(actual.ext).to.equal('txt')
  })

  it('handles complex relative paths', () => {
    const actual = getFilename('../../../dir/test.txt')
    expect(actual.base).to.equal('test')
    expect(actual.ext).to.equal('txt')
  })

  it('handles absolute paths', () => {
    const actual = getFilename('/path/to/dir/test.txt')
    expect(actual.base).to.equal('test')
    expect(actual.ext).to.equal('txt')
  })
})
