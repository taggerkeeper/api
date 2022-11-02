import { Request, Response, NextFunction } from 'express'

const diffRevisions = (req: Request, res: Response, next: NextFunction): void => {
  const { page, revision } = req
  if (page !== undefined && revision !== undefined && req.query.compare !== undefined) {
    const compare = page.getRevisionFromStr(req.query.compare as string)
    if (typeof compare !== 'string') req.revisionsDiff = revision.diff(compare)
  }
  next()
}

export default diffRevisions
