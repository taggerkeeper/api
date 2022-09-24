import { Request, Response, NextFunction } from 'express'
import Page from '../models/page/page.js'

const createPage = function (req: Request, res: Response, next: NextFunction): void {
  if (req.revision !== undefined) req.page = new Page({ revisions: [req.revision] })
  next()
}

export default createPage
