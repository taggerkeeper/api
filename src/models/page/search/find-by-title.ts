import PageModel from '../model.js'
import Page from '../page.js'
import User from '../../user/user.js'
import getPermissionSubquery from '../subqueries/permission.js'

const findByTitle = async (title: string, searcher?: User): Promise<Page | undefined> => {
  const query = Object.assign({}, getPermissionSubquery(searcher), { 'revisions[0].content.title': title })
  const record = await PageModel.findOne(query, null, { sort: { created: 1 } })
  return record === null ? undefined : new Page(record)
}

export default findByTitle
