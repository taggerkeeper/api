import { Request, Response, NextFunction } from 'express'

const demote = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined) req.subject.admin = false
  next()
}

export default demote
