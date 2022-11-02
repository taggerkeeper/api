import { expect } from 'chai'
import File from './file.js'
import diffFiles from './diff.js'

describe('diffFiles', () => {
  const data = {
    a: { location: '/path/to/a.txt', key: 'a.txt', mime: 'text/plain', size: 12345 },
    b: { location: '/path/to/b.txt', key: 'b.txt', mime: 'text/plain', size: 54321 }
  }

  const a = new File(data.a)
  const b = new File(data.b)

  it('compares two files', () => {
    const actual = diffFiles(a, b)

    expect(actual.before?.location).to.equal(data.a.location)
    expect(actual.before?.key).to.equal(data.a.key)
    expect(actual.before?.mime).to.equal(data.a.mime)
    expect(actual.before?.size.str).to.equal('12.3 kB')
    expect(actual.before?.size.bytes).to.equal(data.a.size)

    expect(actual.after?.location).to.equal(data.b.location)
    expect(actual.after?.key).to.equal(data.b.key)
    expect(actual.after?.mime).to.equal(data.b.mime)
    expect(actual.after?.size.str).to.equal('54.3 kB')
    expect(actual.after?.size.bytes).to.equal(data.b.size)
  })

  it('compares a file to nothing', () => {
    const actual = diffFiles(a)
    expect(actual.before?.location).to.equal(data.a.location)
    expect(actual.before?.key).to.equal(data.a.key)
    expect(actual.before?.mime).to.equal(data.a.mime)
    expect(actual.before?.size.str).to.equal('12.3 kB')
    expect(actual.before?.size.bytes).to.equal(data.a.size)
    expect(actual.after).to.equal(null)
  })

  it('compares nothing to a file', () => {
    const actual = diffFiles(null, b)
    expect(actual.before).to.equal(null)
    expect(actual.after?.location).to.equal(data.b.location)
    expect(actual.after?.key).to.equal(data.b.key)
    expect(actual.after?.mime).to.equal(data.b.mime)
    expect(actual.after?.size.str).to.equal('54.3 kB')
    expect(actual.after?.size.bytes).to.equal(data.b.size)
  })

  it('compares nothing to nothing', () => {
    const actual = diffFiles()
    expect(actual.before).to.equal(null)
    expect(actual.after).to.equal(null)
  })
})
