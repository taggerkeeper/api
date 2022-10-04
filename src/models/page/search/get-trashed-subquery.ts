import { PageQuery } from './data.js'
import User from '../../user/user.js'

const getTrashedSubquery = (query?: PageQuery, searcher?: User): any => {
  if (searcher?.admin !== true) return false
  return query === undefined || !query.trashed
    ? { trashed: { $exists: false } }
    : { trashed: { $exists: true, $ne: null } }
}

export default getTrashedSubquery
