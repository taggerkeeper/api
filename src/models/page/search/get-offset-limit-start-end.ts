import { PageQuery } from './data.js'
import getFirstVal from '../../../utils/get-first-val.js'

interface OffsetLimitStartEnd {
  offset: number
  limit: number
  start: number
  end: number
}

const getOffsetLimitStartEnd = (query: PageQuery): OffsetLimitStartEnd => {
  const requestedLimit = parseInt(getFirstVal(query?.limit, process.env.DEFAULT_QUERY_LIMIT, 50))
  const maxLimit = parseInt(getFirstVal(process.env.MAX_QUERY_LIMIT, 1000))
  const limit = Math.min(requestedLimit, maxLimit)
  const offset = query.offset ?? 0
  return { offset, limit, start: offset, end: offset + limit - 1 }
}

export default getOffsetLimitStartEnd
