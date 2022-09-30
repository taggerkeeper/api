import { Request, Response, NextFunction } from 'express'

const updatePage = function (req: Request, res: Response, next: NextFunction): void {
  const { revision } = req
  if (revision !== undefined) req.page?.addRevision(revision)
  if (req.page?.trashed !== undefined) delete req.page.trashed
  next()
}

export default updatePage
