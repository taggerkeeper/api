import RevisionData from '../../../models/revision/data.js'
import Page from '../../../models/page/page.js'

const createTestPage = async (revisions: RevisionData[], trashed: boolean = false): Promise<{ pid: string, path: string }> => {
  const data = trashed ? { revisions, trashed: new Date() } : { revisions }
  const page = new Page(data)
  await page.save()
  return { pid: page.id ?? '', path: page.revisions[0].content.path }
}

export default createTestPage
