import Page from '../page.js'
import PageModel from '../model.js'

const loadPageByPath = async (path: string): Promise<Page | null> => {
  try {
    const record = await PageModel.findOne({ 'revisions.0.content.path': path })
    return record === null ? null : new Page(record)
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadPageByPath
