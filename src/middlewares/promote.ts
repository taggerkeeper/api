import { Request, Response, NextFunction } from 'express'

const promote = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined) req.subject.admin = true
  next()
}

export default promote
