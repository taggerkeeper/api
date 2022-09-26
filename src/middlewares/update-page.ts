import { Request, Response, NextFunction } from 'express'

const updatePage = function (req: Request, res: Response, next: NextFunction): void {
  const { page, revision } = req
  if (revision !== undefined && page !== undefined) page.addRevision(revision)
  next()
}

export default updatePage
