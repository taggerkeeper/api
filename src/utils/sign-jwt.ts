import jwt from 'jsonwebtoken'
import { NPMPackage } from './load-package.js'
import getAPIInfo from './get-api-info.js'
import getEnvVar from './get-env-var.js'

const signJWT = (payload: any, subject: string, expiresIn: number, pkg: NPMPackage): string => {
  const secret = getEnvVar('JWT_SECRET') as string
  const info = getAPIInfo(pkg)
  return jwt.sign(payload, secret, { expiresIn, issuer: info.host, subject })
}

export default signJWT
