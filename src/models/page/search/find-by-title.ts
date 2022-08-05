import PageModel from '../model.js'
import Page from '../page.js'
import User from '../../user/user.js'
import getSecuritySubquery from './get-security-subquery.js'

const findByTitle = async (title: string, searcher?: User): Promise<Page | undefined> => {
  const query = Object.assign({}, getSecuritySubquery(searcher), { 'revisions[0].content.title': title })
  const record = await PageModel.findOne(query, null, { sort: { created: 1 } })
  return record === null ? undefined : new Page(record)
}

export default findByTitle
