import { Request, Response, NextFunction } from 'express'

const requireUser = function (req: Request, res: Response, next: NextFunction): void {
  if (req.user === undefined) {
    res.status(401).send({ message: 'This method requires authentication.' })
  } else if (!req.user.active) {
    res.status(403).send({ message: 'Your account has been deactivated.' })
  } else {
    next()
  }
}

export default requireUser
