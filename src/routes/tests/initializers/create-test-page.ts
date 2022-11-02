import RevisionData from '../../../models/revision/data.js'
import Page from '../../../models/page/page.js'

const createTestPage = async (revisions: RevisionData[], trashed: boolean = false): Promise<string> => {
  const data = trashed ? { revisions, trashed: new Date() } : { revisions }
  const page = new Page(data)
  await page.save()
  return page.id ?? ''
}

export default createTestPage
