import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'

const savePage = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.page !== undefined) await req.page.save()
  } catch (err) {
    console.error(err)
  }
  next()
}

export default expressAsyncHandler(savePage)
