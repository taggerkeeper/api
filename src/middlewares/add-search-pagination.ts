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

    const makeLink = (changes: any, rel: string): string => {
      return `<${endpoint}?${getQueryStr(Object.assign({}, orig, changes))}>; rel="${rel}"`
    }

    const { total, start, end } = req.searchResults
    const per = end - start
    const prev = start - per
    const last = total - per

    const links = []
    if (start > 0) links.push(makeLink({ offset: 0 }, 'first'))
    if (prev >= 0) links.push(makeLink({ offset: prev }, 'previous'))
    if (end < total) links.push(makeLink({ offset: end }, 'next'))
    if (end < total) links.push(makeLink({ offset: last }, 'last'))
    res.set('Link', links.join(', '))
  }
  next()
}

export default expressAsyncHandler(addSearchPagination)
