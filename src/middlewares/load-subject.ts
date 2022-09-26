import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import loadUserById from '../models/user/loaders/by-id.js'

const loadSubject = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const subject = await loadUserById(req.params.uid)
    if (subject !== null) req.subject = subject
  } catch (err) {
    console.error(err)
  }
  next()
}

export default expressAsyncHandler(loadSubject)
