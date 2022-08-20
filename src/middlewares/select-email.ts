import { Request, Response, NextFunction } from 'express'

const selectEmail = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined && req.params.addr !== undefined) {
    const emails = req.subject.emails.filter(email => email.addr === req.params.addr)
    if (emails.length > 0) req.email = emails[0]
  }
  next()
}

export default selectEmail
