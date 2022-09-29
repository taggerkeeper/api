import PageModel from '../model.js'
import Page from '../page.js'
import User from '../../user/user.js'
import getPermissionSubquery from '../subqueries/permission.js'

const findByPath = async (path: string, searcher?: User): Promise<Page | undefined> => {
  const query = Object.assign({}, getPermissionSubquery(searcher), { path })
  const record = await PageModel.findOne(query)
  return record === null ? undefined : new Page(record)
}

export default findByPath
