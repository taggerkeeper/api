import getSubqueries from '../subqueries/index.js'
import Page from '../page.js'
import PageModel from '../model.js'
import User from '../../user/user.js'

const loadPageByTitle = async (title: string, searcher?: User): Promise<Page | null> => {
  try {
    const query = { $and: [{ 'revisions.0.content.title': title }, ...getSubqueries(searcher)] }
    const record = await PageModel.findOne(query, null, { sort: { created: 1 } }).populate('revisions.editor')
    return record === null || record === undefined ? null : new Page(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadPageByTitle
