import mongoose from 'mongoose'
import Page from '../page.js'
import PageModel from '../model.js'
const { isValid } = mongoose.Types.ObjectId

const loadPageById = async (id: string): Promise<Page | null> => {
  try {
    if (!isValid(id)) return null
    const record = await PageModel.findById(id)
    return record === null ? null : new Page(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadPageById
