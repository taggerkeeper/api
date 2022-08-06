import { expect } from 'chai'
import getRootBase from './get-root-base.js'

describe('getRootBase', () => {
  it('returns the API root', async () => {
    const { root } = await getRootBase()
    expect(root).to.equal('https://localhost:8080/v1')
  })

  it('returns the API host', async () => {
    const { host } = await getRootBase()
    expect(host).to.equal('https://localhost:8080')
  })

  it('returns the API base', async () => {
    const { base } = await getRootBase()
    expect(base).to.equal('/v1')
  })

  it('drops the port if the port is 80', async () => {
    process.env.PORT = '80'
    const { root } = await getRootBase()
    delete process.env.PORT
    expect(root).to.equal('https://localhost/v1')
  })

  it('includes the path', async () => {
    process.env.APIPATH = '/path/to/api'
    const { root } = await getRootBase()
    delete process.env.APIPATH
    expect(root).to.equal('https://localhost:8080/path/to/api/v1')
  })
})
