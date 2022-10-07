import { Request, Response, NextFunction } from 'express'

const rollback = (req: Request, res: Response, next: NextFunction): void => {
  if (req.page !== undefined && req.revision !== undefined) req.page.rollback(req.revision, req.user)
  next()
}

export default rollback
