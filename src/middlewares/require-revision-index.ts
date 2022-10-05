import { Request, Response, NextFunction } from 'express'

const requireRevisionIndex = (req: Request, res: Response, next: NextFunction): void => {
  const r = parseInt(req.params.revision)
  const max = (req.page?.revisions.length ?? 0) - 1
  if (max < 0) {
    res.status(404).send({ message: 'Page not found.' })
  } else if (isNaN(r) || r < 0 || r > max) {
    res.status(400).send({ message: `${req.params.revision} is not a valid index for any revision of this page. Please provide an index between 0 and ${max}.`})
  } else {
    req.revision = req.page?.revisions[r]
    next()
  }
}

export default requireRevisionIndex
