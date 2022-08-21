import jwt from 'jsonwebtoken'
import { NPMPackage } from './load-package.js'
import getFirstVal from './get-first-val.js'
import getAPIInfo from './get-api-info.js'
import getEnvVar from './get-env-var.js'

const signJWT = (payload: any, subject: string, expiresIn: number, pkg: NPMPackage): string => {
  const secret = getFirstVal(getEnvVar('JWT_SECRET'), 'load a secret as an environment variable named JWT_SECRET')
  const info = getAPIInfo(pkg)
  return jwt.sign(payload, secret, { expiresIn, issuer: info.host, subject })
}

export default signJWT
