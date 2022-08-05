import { PageQuery } from './data.js'
import getFirstVal from '../../../utils/get-first-val.js'

const getLimit = (query?: PageQuery): number => {
  const requestedLimit = parseInt(getFirstVal(query?.limit, process.env.DEFAULT_QUERY_LIMIT, 50))
  const maxLimit = parseInt(getFirstVal(process.env.MAX_QUERY_LIMIT, 1000))
  return Math.min(requestedLimit, maxLimit)
}

export default getLimit
