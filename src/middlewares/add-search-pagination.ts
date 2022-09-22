import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import loadPackage from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'
import getQueryStr from '../utils/get-query-str.js'

const addSearchPagination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.searchResults !== undefined) {
    const pkg = await loadPackage()
    const { root } = getAPIInfo(pkg)
    const endpoint = `${root}/pages`
    const orig = req.query as any

    const makeLink = (changes: any, rel: string): void => {
      res.set('Link', `<${endpoint}?${getQueryStr(Object.assign({}, orig, changes))}>; rel="${rel}"`)
    }

    const { total, start, end } = req.searchResults
    const per = end - start
    const prev = start - per
    const last = total - per

    if (start > 0) makeLink({ offset: 0 }, 'first')
    if (prev >= 0) makeLink({ offset: prev }, 'previous')
    if (end < total) makeLink({ offset: end }, 'next')
    if (end < total) makeLink({ offset: last }, 'last')
  }
  next()
}

export default expressAsyncHandler(addSearchPagination)
