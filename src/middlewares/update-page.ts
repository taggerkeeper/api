import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'

const updatePage = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.revision !== undefined) req.page?.addRevision(req.revision)
  if (req.page !== undefined) await req.page.untrash()
  next()
}

export default expressAsyncHandler(updatePage)
