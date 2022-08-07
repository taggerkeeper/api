import { Request, Response, NextFunction } from 'express'

const setPassword = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined && req.body.password !== undefined) {
    req.subject.password.change(req.body.password)
  }
  next()
}

export default setPassword
