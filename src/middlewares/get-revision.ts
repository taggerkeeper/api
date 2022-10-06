import { Request, Response, NextFunction } from 'express'

const getRevision = (req: Request, res: Response, next: NextFunction): void => {
  const revision = req.page?.getRevisionFromStr(req.params.revision)
  if (typeof revision === 'string') {
    res.status(400).send({ message: revision })
  } else {
    req.revision = revision
    next()
  }
}

export default getRevision
