import { expect } from 'chai'
import getRoot from './get-root.js'

describe('getRoot', () => {
  it('returns the API root', async () => {
    const root = await getRoot()
    expect(root).to.equal('https://localhost:8080/v1')
  })

  it('drops the port if the port is 80', async () => {
    process.env.PORT = '80'
    const root = await getRoot()
    delete process.env.PORT
    expect(root).to.equal('https://localhost/v1')
  })

  it('includes the path', async () => {
    process.env.APIPATH = '/path/to/api'
    const root = await getRoot()
    delete process.env.APIPATH
    expect(root).to.equal('https://localhost:8080/path/to/api/v1')
  })
})
