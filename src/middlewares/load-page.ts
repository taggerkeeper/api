import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import loadPageById from '../models/page/loaders/by-id.js'

const loadPage = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = await loadPageById(req.params.pid)
    if (page !== null) req.page = page
  } catch (err) {
    console.error(err)
  }
  next()
}

export default expressAsyncHandler(loadPage)
