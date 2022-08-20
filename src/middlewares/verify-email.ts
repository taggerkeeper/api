import { Request, Response, NextFunction } from 'express'

const verifyEmail = function (req: Request, res: Response, next: NextFunction): void {
  if (req.email !== undefined && req.body.code !== undefined) {
    req.email.verify(req.body.code)
  }
  next()
}

export default verifyEmail
