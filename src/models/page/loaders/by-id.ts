import mongoose from 'mongoose'
import getSecuritySubquery from '../search/get-security-subquery.js'
import Page from '../page.js'
import PageModel from '../model.js'
import User from '../../user/user.js'
const { isValid } = mongoose.Types.ObjectId

const loadPageById = async (id: string, searcher?: User): Promise<Page | null> => {
  try {
    if (!isValid(id)) return null
    const record = await PageModel.findOne({ $and: [{ _id: id }, getSecuritySubquery(searcher)] })
    return record === null ? null : new Page(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadPageById
