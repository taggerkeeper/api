import { Request, Response, NextFunction } from 'express'
import Email from '../models/email/email.js'

const addEmail = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject !== undefined) {
    const email = new Email({ addr: req.body.email })
    req.subject.emails = [...req.subject.emails, email]
  }
  next()
}

export default addEmail
