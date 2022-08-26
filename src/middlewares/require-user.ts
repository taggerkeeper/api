import { Request, Response, NextFunction } from 'express'

const requireUser = function (req: Request, res: Response, next: NextFunction): void {
  if (req.user === undefined) {
    res.status(401).send({ message: 'This method requires authentication.' })
  } else {
    next()
  }
}

export default requireUser
