import { Request, Response, NextFunction } from 'express'

const updateSubjectName = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined && req.body.name !== undefined) req.subject.name = req.body.name
  next()
}

export default updateSubjectName
