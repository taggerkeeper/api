import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'

const saveUser = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user !== undefined) await req.user.save()
  } catch (err) {
    console.error(err)
  }
  next()
}

export default expressAsyncHandler(saveUser)
