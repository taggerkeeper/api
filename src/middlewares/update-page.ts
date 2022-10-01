import { Request, Response, NextFunction } from 'express'

const updatePage = function (req: Request, res: Response, next: NextFunction): void {
  if (req.revision !== undefined) req.page?.addRevision(req.revision)
  if (req.page !== undefined) req.page.trashed = undefined
  next()
}

export default updatePage
