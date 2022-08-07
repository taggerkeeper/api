import { Request, Response, NextFunction } from 'express'
import User from '../models/user/user.js'

const createUser = function (req: Request, res: Response, next: NextFunction): void {
  req.subject = new User({ name: req.body.name })
}

export default createUser
