import Page from '../page.js'
import PageModel from '../model.js'
import { PageSearchOptions } from './data.js'

const searchText = async (query: any, options: PageSearchOptions): Promise<Page[]> => {
  const { sort, offset, limit } = options
  const score = { score: { $meta: 'textScore' } }
  const results = PageModel.find(query, score)
  const sorted = (sort === undefined || sort === 'relevance')
    ? results.sort(score as any)
    : sort === undefined ? results : results.sort(sort)
  const records = await sorted.populate('revisions.editor').skip(offset).limit(limit)
  return records.map(record => new Page(record))
}

export default searchText
