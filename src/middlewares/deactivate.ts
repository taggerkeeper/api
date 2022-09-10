import { Request, Response, NextFunction } from 'express'

const deactivate = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined) req.subject.active = false
  next()
}

export default deactivate
