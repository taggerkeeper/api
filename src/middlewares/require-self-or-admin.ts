import { Request, Response, NextFunction } from 'express'

const requireSelfOrAdmin = function (req: Request, res: Response, next: NextFunction): void {
  const isAdmin = req.user?.admin === true
  const isSubject = req.subject !== undefined && req.user !== undefined && req.subject?.id === req.user?.id
  if (!isAdmin && !isSubject) {
    res.status(403).send({ message: 'This method requires authentication by the subject or an administrator.' })
  } else {
    next()
  }
}

export default requireSelfOrAdmin
