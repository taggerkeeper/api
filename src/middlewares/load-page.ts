import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import getPath from '../utils/get-path.js'
import loadPageById from '../models/page/loaders/by-id.js'
import loadPageByPath from '../models/page/loaders/by-path.js'

const loadPage = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { pid } = req.params
    const path = await getPath(req.originalUrl)
    const page = path !== `/${pid}` ? await loadPageByPath(path, req.user) : await loadPageById(pid, req.user)
    if (page !== null) req.page = page
  } catch (err) {
    console.error(err)
  }
  next()
}

export default expressAsyncHandler(loadPage)
