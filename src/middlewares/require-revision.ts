import { Request, Response, NextFunction } from 'express'

const requireRevision = function (req: Request, res: Response, next: NextFunction): void {
  if (req.revision === undefined) {
    res.status(404).send({ message: 'Revision not found.' })
  } else {
    next()
  }
}

export default requireRevision
