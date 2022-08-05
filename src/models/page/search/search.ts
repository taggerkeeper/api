import User from '../../user/user.js'
import PageModel from '../model.js'
import { PageQuery, PageQueryResultSet } from './data.js'
import buildQuery from './build-query.js'
import getOffsetLimitStartEnd from './get-offset-limit-start-end.js'
import searchText from './search-text.js'
import searchWithoutText from './search-without-text.js'

const search = async (query: PageQuery, searcher?: User): Promise<PageQueryResultSet> => {
  const { sort, text } = query
  const { offset, limit, start, end } = getOffsetLimitStartEnd(query)
  const titleField = 'revisions.0.content.title'
  const sortOrder = sort === 'alphabetical' ? titleField : sort === '-alphabetical' ? `-${titleField}` : sort ?? titleField
  const q = buildQuery(query, searcher)
  const pages = text !== undefined
    ? await searchText(q, { sort: sortOrder, offset, limit })
    : await searchWithoutText(q, { sort: sortOrder, offset, limit })
  const total = await PageModel.countDocuments(q)
  return { total, start, end, pages }
}

export default search
