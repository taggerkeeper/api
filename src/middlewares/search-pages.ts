import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import search from '../models/page/search/search.js'
import parsePageQuery from '../parse/page-query.js'

const searchPages = async (req: Request, res: Response, next: NextFunction) => {
  req.searchResults = await search(parsePageQuery(req), req.user)
  next()
}

export default expressAsyncHandler(searchPages)
