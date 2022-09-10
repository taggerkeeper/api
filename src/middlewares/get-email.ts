import { Request, Response, NextFunction } from 'express'

const getEmail = function (req: Request, res: Response, next: NextFunction): void {
  const { addr } = req.params
  const emails = req.subject?.emails.filter(email => email.addr === addr)
  if (emails !== undefined && emails.length > 0) req.email = emails[0]
  next()
}

export default getEmail
