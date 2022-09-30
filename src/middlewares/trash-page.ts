import { Request, Response, NextFunction } from 'express'

const trashPage = function (req: Request, res: Response, next: NextFunction): void {
  if (req.page !== undefined) req.page.trashed = new Date()
  next()
}

export default trashPage
