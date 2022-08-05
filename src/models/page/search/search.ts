import Page from '../page.js'
import User from '../../user/user.js'
import PageModel from '../model.js'
import { PageQuery, PageQueryResultSet } from './data.js'
import buildQuery from './build-query.js'
import getOffsetLimitStartEnd from './get-offset-limit-start-end.js'

const search = async (query: PageQuery, searcher?: User): Promise<PageQueryResultSet> => {
  const { sort, text } = query
  const { offset, limit, start, end } = getOffsetLimitStartEnd(query)
  const includesTextQuery = text !== undefined
  const sortOrder = sort === 'alphabetical'
    ? 'revisions.0.content.title'
    : sort === '-alphabetical'
      ? '-revisions.0.content.title'
      : sort
  const q = buildQuery(query, searcher)
  const score = includesTextQuery ? { score: { $meta: 'textScore' } } : null
  const results = includesTextQuery ? PageModel.find(q, score) : PageModel.find(q)
  const sorted = (includesTextQuery && (sortOrder === undefined || sortOrder === 'relevance'))
    ? results.sort(score as any)
    : sortOrder === undefined ? results : results.sort(sortOrder)
  const records = await sorted.populate('revisions.editor').skip(offset).limit(limit)
  const pages = records.map(record => new Page(record))
  const total = await PageModel.countDocuments(q)
  return { total, start, end, pages }
}

export default search
