import { Request, Response, NextFunction } from 'express'

const requireSubject = function (req: Request, res: Response, next: NextFunction): void {
  if (req.subject === undefined) {
    const { uid } = req.params
    const message = uid === undefined ? 'No user ID (uid) provided.' : `No user found with the ID ${uid}.`
    const status = uid === undefined ? 400 : 404
    res.status(status).send({ message })
  } else {
    next()
  }
}

export default requireSubject
