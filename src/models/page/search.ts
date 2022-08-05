import Page from './page.js'
import getFirstVal from '../../utils/get-first-val.js'

const getLimit = (limit?: number): number => {
  const requestedLimit = parseInt(getFirstVal(limit, process.env.DEFAULT_QUERY_LIMIT, 50))
  const maxLimit = parseInt(getFirstVal(process.env.MAX_QUERY_LIMIT, 1000))
  return Math.min(requestedLimit, maxLimit)
}

export {
  getLimit
}
