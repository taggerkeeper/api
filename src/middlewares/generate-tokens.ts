import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import getEnvVar from '../utils/get-env-var.js'
import loadPackage, { NPMPackage } from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'
import signJWT from '../utils/sign-jwt.js'

const generateTokens = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.user === undefined) {
    res.status(401).send({ message: 'This method requires authentication' })
  } else {
    const pkg = await loadPackage() as NPMPackage
    const { root, host } = getAPIInfo(pkg)
    const subject = `${root}/users/${req.user.id as string}`
    req.user.generateRefresh()
    const refreshExpires = getEnvVar('REFRESH_EXPIRES') as number
    req.tokens = {
      access: signJWT(req.user.getPublicObj(), subject, getEnvVar('JWT_EXPIRES') as number, pkg),
      refresh: signJWT({ uid: req.user.id, refresh: req.user.refresh }, subject, refreshExpires, pkg),
      refreshExpires
    }
    next()
  }
}

export default expressAsyncHandler(generateTokens)
