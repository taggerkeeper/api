import getSecuritySubquery from '../search/get-security-subquery.js'
import Page from '../page.js'
import PageModel from '../model.js'
import User from '../../user/user.js'

const loadPageByPath = async (path: string, searcher?: User): Promise<Page | null> => {
  try {
    const record = await PageModel.findOne({ $and: [{ 'revisions.0.content.path': path }, getSecuritySubquery(searcher)] })
    return record === null ? null : new Page(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadPageByPath
