import mongoose from 'mongoose'
import getPermissionSubquery from '../subqueries/permission.js'
import Page from '../page.js'
import PageModel from '../model.js'
import User from '../../user/user.js'
const { isValid } = mongoose.Types.ObjectId

const loadPageById = async (id: string, searcher?: User): Promise<Page | null> => {
  try {
    if (!isValid(id)) return null
    const query = { $and: [{ _id: id }, getPermissionSubquery(searcher)] }
    const record = await PageModel.findOne(query).populate('revisions.editor')
    return record === null || record === undefined ? null : new Page(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadPageById
