import { Request, Response, NextFunction } from 'express'

const updateSubjectPassword = function (req: Request, res: Response, next: NextFunction): void {
  const { password } = req.body
  if (req.subject !== undefined && password !== undefined) req.subject.password.change(password)
  next()
}

export default updateSubjectPassword
