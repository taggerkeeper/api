import User from '../../user/user.js'
import { PageQuery } from './data.js'
import getSubqueries from '../subqueries/index.js'
import getRevisionsSubquery from './get-revisions-subquery.js'
import getTextSubquery from './get-text-subquery.js'
import getTimeSubquery from './get-time-subquery.js'
import getTrashedSubquery from './get-trashed-subquery.js'

const buildQuery = (query: PageQuery, searcher?: User): any => {
  const subqueries = [
    ...getSubqueries(searcher),
    getRevisionsSubquery(query),
    getTextSubquery(query),
    getTimeSubquery(query, 'created'),
    getTimeSubquery(query, 'updated'),
    getTrashedSubquery(query, searcher)
  ].filter(subquery => subquery !== false)
  return Object.assign({}, ...subqueries)
}

export default buildQuery
