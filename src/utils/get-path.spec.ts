import { expect } from 'chai'
import getPath from './get-path.js'

describe('getPath', () => {
  it('extracts the path', () => {
    expect(getPath('/path/to/page')).to.equal('/path/to/page')
  })

  it('skips the root', () => {
    expect(getPath('/pages/path/to/page')).to.equal('/path/to/page')
  })

  it('skips actions', () => {
    expect(getPath('/path/to/page/revisions')).to.equal('/path/to/page')
    expect(getPath('/path/to/page/revisions/0123456789abcdef01234567')).to.equal('/path/to/page')
  })

  it('leaves off the query string', () => {
    expect(getPath('/path/to/page?q=test&n=10')).to.equal('/path/to/page')
  })

  it('does all of it at once', () => {
    const url = '/pages/path/to/page/revisions/0123456789abcdef01234567?q=test&n=10'
    expect(getPath(url)).to.equal('/path/to/page')
  })
})
