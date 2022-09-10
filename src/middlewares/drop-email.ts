import { Request, Response, NextFunction } from 'express'

const dropEmail = function (req: Request, res: Response, next: NextFunction): void {
  const { addr } = req.params
  if (addr !== undefined && req.subject !== undefined) {
    req.subject.emails = req.subject.emails.filter(email => email.addr !== addr)
  }
  next()
}

export default dropEmail
