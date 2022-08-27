import { Request, Response, NextFunction } from 'express'

const requireAdmin = function (req: Request, res: Response, next: NextFunction): void {
  if (req.user?.admin !== true) {
    res.status(401).send({ message: 'This method requires authentication by an administrator.' })
  } else {
    next()
  }
}

export default requireAdmin
