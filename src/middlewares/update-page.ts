import { Request, Response, NextFunction } from 'express'

const updatePage = function (req: Request, res: Response, next: NextFunction): void {
  if (req.revision !== undefined) req.page?.addRevision(req.revision)
  next()
}

export default updatePage
