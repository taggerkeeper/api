import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import User from '../models/user/user.js'
import UserModel from '../models/user/model.js'

const loadSubject = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { uid } = req.params
    const data = uid === undefined ? undefined : await UserModel.findById(uid)
    req.subject = data === null || data === undefined ? undefined : new User(data)
  } catch (err) {
    console.error(err)
  }
  next()
}

export default expressAsyncHandler(loadSubject)
