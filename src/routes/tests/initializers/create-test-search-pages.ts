import User from '../../../models/user/user.js'
import PageData from '../../../models/page/data.js'
import Page from '../../../models/page/page.js'
import { PermissionLevel } from '../../../models/permissions/data.js'

const createTestSearchPages = async (editor: User): Promise<void> => {
  const pages = []
  for (let i = 1; i <= 15; i++) {
    const data: PageData = { revisions: [{ content: { title: `Test Page #${i}`, path: `/test-${i}`, body: 'This is a test page.' } }] }
    if (i > 10) data.trashed = new Date()
    pages.push(new Page(data))
  }

  pages.push(new Page({ revisions: [{ content: { title: 'Authenticated Only', path: '/auth', body: 'Authenticated only.' }, permissions: { read: PermissionLevel.authenticated, write: PermissionLevel.authenticated } }] }))
  pages.push(new Page({ revisions: [{ content: { title: 'Editor Only', path: '/editor', body: 'Editor only.' }, permissions: { read: PermissionLevel.editor, write: PermissionLevel.editor }, editor: editor.getObj() }] }))
  pages.push(new Page({ revisions: [{ content: { title: 'Admin Only', path: '/admin', body: 'Admin only.' }, permissions: { read: PermissionLevel.admin, write: PermissionLevel.admin } }] }))

  await Promise.all(pages.map(async page => await page.save()))
}

export default createTestSearchPages
