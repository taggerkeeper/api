import { expect } from 'chai'
import jwt from 'jsonwebtoken'
import loadPackage from './load-package.js'
import getFirstVal from './get-first-val.js'
import getAPIInfo from './get-api-info.js'
import getEnvVar from './get-env-var.js'
import signJWT from './sign-jwt.js'

describe('signJWT', () => {
  const payload = { n: 42 }
  const subject = '/test'
  const expiresIn = 300
  const secret = getFirstVal(getEnvVar('JWT_SECRET'), 'load a secret as an environment variable named JWT_SECRET')
  let actual: string

  beforeEach(async () => {
    actual = await signJWT(payload, subject, expiresIn)
  })

  it('returns a string', () => {
    expect(actual).to.be.a('string')
  })

  it('returns a verifiable JSON web token', () => {
    const obj = jwt.verify(actual, secret) as any
    expect(obj.n).to.equal(payload.n)
  })

  it('contains the subject provided', () => {
    const decoded = jwt.decode(actual) as any
    expect(decoded.sub).to.equal(subject)
  })

  it('contains the domain', async () => {
    const pkg = await loadPackage()
    const info = getAPIInfo(pkg)
    const decoded = jwt.decode(actual) as any
    expect(decoded.iss).to.equal(info.host)
  })
})
