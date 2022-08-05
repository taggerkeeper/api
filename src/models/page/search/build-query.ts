import User from '../../user/user.js'
import { PageQuery } from './data.js'
import getRevisionsSubquery from './get-revisions-subquery.js'
import getSecuritySubquery from './get-security-subquery.js'
import getTextSubquery from './get-text-subquery.js'
import getTimeSubquery from './get-time-subquery.js'

const buildQuery = (query: PageQuery, searcher?: User): any => {
  const subqueries = [
    getRevisionsSubquery(query),
    getSecuritySubquery(searcher),
    getTextSubquery(query),
    getTimeSubquery(query, 'created'),
    getTimeSubquery(query, 'updated')
  ].filter(subquery => subquery !== false)
  return Object.assign({}, ...subqueries)
}

export default buildQuery
