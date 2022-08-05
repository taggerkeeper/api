import Page from '../page.js'
import PageModel from '../model.js'
import { PageSearchOptions } from './data.js'

const searchWithoutText = async (query: any, options: PageSearchOptions): Promise<Page[]> => {
  const { sort, offset, limit } = options
  const results = PageModel.find(query)
  const sorted = sort === undefined ? results : results.sort(sort)
  const records = await sorted.populate('revisions.editor').skip(offset).limit(limit)
  return records.map(record => new Page(record))
}

export default searchWithoutText
