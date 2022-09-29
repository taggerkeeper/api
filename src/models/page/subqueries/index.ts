import User from '../../user/user.js'
import getPermissionSubquery from './permission.js'
import getUntrashedSubquery from './untrashed.js'

const getSubqueries = (searcher?: User): any[] => {
  return [
    getPermissionSubquery(searcher),
    getUntrashedSubquery(searcher)
  ].filter(subquery => subquery !== false)
}

export default getSubqueries
