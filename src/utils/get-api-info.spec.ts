import { expect } from 'chai'
import getAPIInfo from './get-api-info.js'

describe('getAPIInfo', () => {
  const pkg = { version: '1.0.0' }

  it('returns the API root', () => {
    const { root } = getAPIInfo(pkg)
    expect(root).to.equal('https://localhost:8080/v1')
  })

  it('returns the API host', () => {
    const { host } = getAPIInfo(pkg)
    expect(host).to.equal('https://localhost:8080')
  })

  it('returns the API base', () => {
    const { base } = getAPIInfo(pkg)
    expect(base).to.equal('/v1')
  })

  it('drops the port if the port is 80', () => {
    process.env.PORT = '80'
    const { root } = getAPIInfo(pkg)
    delete process.env.PORT
    expect(root).to.equal('https://localhost/v1')
  })

  it('includes the path', () => {
    process.env.API_PATH = '/path/to/api'
    const { root } = getAPIInfo(pkg)
    delete process.env.API_PATH
    expect(root).to.equal('https://localhost:8080/path/to/api/v1')
  })
})
