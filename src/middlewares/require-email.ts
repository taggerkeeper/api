import { Request, Response, NextFunction } from 'express'

const requireEmail = function (req: Request, res: Response, next: NextFunction): void {
  if (req.email === undefined) {
    const { addr } = req.params
    const message = addr === undefined ? 'No email address provided.' : `No email found with the given address (${addr}).`
    const status = addr === undefined ? 400 : 404
    res.status(status).send({ message })
  } else {
    next()
  }
}

export default requireEmail
