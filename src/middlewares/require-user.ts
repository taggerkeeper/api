import { Request, Response, NextFunction } from 'express'

const requireUser = function (req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.substring(7)
  const tokenReceived = token !== undefined && token.length > 0
  if (req.user === undefined && !tokenReceived) {
    res.status(400).send({ message: 'This method requires authentication.' })
  } else if (req.user === undefined) {
    res.set('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    res.status(401).send({ message: 'This method requires authentication.' })
  } else if (!req.user.active) {
    res.status(403).send({ message: 'Your account has been deactivated.' })
  } else {
    next()
  }
}

export default requireUser
