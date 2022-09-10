import { Request, Response, NextFunction } from 'express'

const activate = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined) req.subject.active = true
  next()
}

export default activate
