import jwt from 'jsonwebtoken'
import loadPackage from './load-package.js'
import getFirstVal from './get-first-val.js'
import getAPIInfo from './get-api-info.js'
import getEnvVar from './get-env-var.js'

const signJWT = async (payload: any, subject: string, expiresIn: number): Promise<string> => {
  const secret = getFirstVal(getEnvVar('JWT_SECRET'), 'load a secret as an environment variable named JWT_SECRET')
  const pkg = await loadPackage()
  const info = getAPIInfo(pkg)
  return jwt.sign(payload, secret, { expiresIn, issuer: info.host, subject })
}

export default signJWT
