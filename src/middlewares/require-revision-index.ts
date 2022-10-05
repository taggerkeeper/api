import { Request, Response, NextFunction } from 'express'

const requireRevisionIndex = (req: Request, res: Response, next: NextFunction): void => {
  const revision = req.page?.getRevisionFromStr(req.params.revision)
  if (revision === undefined) {
    res.status(404).send({ message: 'Page not found.' })
  } else if (typeof revision === 'string') {
    res.status(400).send({ message: revision })
  } else {
    req.revision = revision
    next()
  }
}

export default requireRevisionIndex
