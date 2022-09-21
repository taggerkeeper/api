import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import search from '../models/page/search/search.js'
import parsePageQuery from '../parse/page-query.js'

const searchPages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  req.searchResults = await search(parsePageQuery(req), req.user)
  next()
}

export default expressAsyncHandler(searchPages)
