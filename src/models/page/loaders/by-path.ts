import getPermissionSubquery from '../subqueries/permission.js'
import Page from '../page.js'
import PageModel from '../model.js'
import User from '../../user/user.js'

const loadPageByPath = async (path: string, searcher?: User): Promise<Page | null> => {
  try {
    const query = { $and: [{ 'revisions.0.content.path': path }, getPermissionSubquery(searcher)] }
    const record = await PageModel.findOne(query).populate('revisions.editor')
    return record === null || record === undefined ? null : new Page(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadPageByPath
