import { Request, Response, NextFunction } from 'express'

const getRevision = (req: Request, res: Response, next: NextFunction): void => {
  if (req.page !== undefined && req.params.revision !== undefined) {
    const n = parseInt(req.params.revision)
    if (!isNaN(n) && n <= req.page.revisions.length) req.revision = req.page.revisions[n - 1]
  }
  next()
}

export default getRevision
