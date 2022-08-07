import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import User from '../models/user/user.js'

const createUser = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  req.subject = new User({ name: req.body.name })
  await req.subject.save()
}

export default expressAsyncHandler(createUser)
