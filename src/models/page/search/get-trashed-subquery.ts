import { PageQuery } from './data.js'

const getTrashedSubquery = (query?: PageQuery): any => {
  if (query === undefined || !query.trashed) return false
  return { trashed: { $exists: true, $ne: null } }
}

export default getTrashedSubquery
