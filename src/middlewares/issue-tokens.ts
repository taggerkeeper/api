import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import getEnvVar from '../utils/get-env-var.js'
import loadPackage, { NPMPackage } from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'
import signJWT from '../utils/sign-jwt.js'

const issueTokens = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.user === undefined) {
    res.status(401).send({ message: 'You are not authoried.' })
  } else {
    const pkg = await loadPackage() as NPMPackage
    const { root, host } = getAPIInfo(pkg)
    const subject = `${root}/users/${req.user.id as string}`
    req.user.generateRefresh()
    const refreshExpires = getEnvVar('REFRESH_EXPIRES') as number
    const token = signJWT(req.user.getPublicObj(), subject, getEnvVar('JWT_EXPIRES') as number, pkg)
    const refresh = signJWT({ uid: req.user.id, refresh: req.user.refresh }, subject, refreshExpires, pkg)
    res.cookie('refresh', refresh, { domain: host, httpOnly: true, maxAge: refreshExpires })
    res.status(200).send({ token })
  }
}

export default expressAsyncHandler(issueTokens)
