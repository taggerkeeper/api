import { Request, Response, NextFunction } from 'express'

const verifyEmail = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined && req.params.code !== undefined) {
    const emails = req.subject.emails.filter(email => email.verify(req.params.code))
    if (emails.length > 0) req.email = emails[0]
  }
  next()
}

export default verifyEmail
