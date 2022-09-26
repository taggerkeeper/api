import { expect } from 'chai'
import loadPackage from './load-package.js'
import getAPIInfo from './get-api-info.js'
import getPath from './get-path.js'

describe('getPath', () => {
  let base: string

  beforeEach(async () => {
    const pkg = await loadPackage()
    const info = await getAPIInfo(pkg)
    base = info.base
  })

  it('extracts the path', async () => {
    const path = await getPath('/path/to/page')
    expect(path).to.equal('/path/to/page')
  })

  it('skips the root', async () => {
    const path = await getPath(`${base}/pages/path/to/page`)
    expect(path).to.equal('/path/to/page')
  })

  it('skips actions', async () => {
    const revisionsCollection = await getPath('/path/to/page/revisions')
    const revisionsItem = await getPath('/path/to/page/revisions/0123456789abcdef01234567')
    expect(revisionsCollection).to.equal('/path/to/page')
    expect(revisionsItem).to.equal('/path/to/page')
  })

  it('leaves off the query string', async () => {
    const path = await getPath('/path/to/page?q=test&n=10')
    expect(path).to.equal('/path/to/page')
  })

  it('does all of it at once', async () => {
    const path = await getPath(`${base}/pages/path/to/page/revisions/0123456789abcdef01234567?q=test&n=10`)
    expect(path).to.equal('/path/to/page')
  })
})
