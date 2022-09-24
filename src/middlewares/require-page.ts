import { Request, Response, NextFunction } from 'express'

const requirePage = function (req: Request, res: Response, next: NextFunction): void {
  if (req.page === undefined) {
    res.status(404).send({ message: 'Page not found.' })
  } else {
    next()
  }
}

export default requirePage
