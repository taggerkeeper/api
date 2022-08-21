import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import getFirstVal from '../utils/get-first-val.js'
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
    const refreshExpires = getFirstVal(getEnvVar('REFRESH_EXPIRES'), 86400000)
    const token = signJWT(req.user.getPublicObj(), subject, getFirstVal(getEnvVar('JWT_EXPIRES'), 300), pkg)
    const refresh = signJWT({ refresh: req.user.refresh }, subject, refreshExpires, pkg)
    res.cookie('refresh', refresh, { domain: host, httpOnly: true, maxAge: refreshExpires })
    res.status(200).send({ token })
  }
}

export default expressAsyncHandler(issueTokens)
