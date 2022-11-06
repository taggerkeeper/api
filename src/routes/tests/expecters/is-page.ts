import { expect } from 'chai'
import { Response } from 'superagent'
import hasStatusAndHeaders from './has-status-and-headers.js'
import isFile, { FileExpectations } from './is-file.js'
import RevisionData from '../../../models/revision/data.js'
import loadPageById from '../../../models/page/loaders/by-id.js'
import Page from '../../../models/page/page.js'
import { PermissionLevel } from '../../../models/permissions/data.js'

interface ExpectedPage {
  headers: { [key: string]: string | RegExp }
  revision?: RevisionData
  file?: FileExpectations
  thumbnail?: FileExpectations
}

const isPage = async (res: Response, expected?: ExpectedPage): Promise<Page | null> => {
  const elems = res.headers.location.split('/')
  const page = await loadPageById(elems[elems.length - 1])
  const content = expected?.revision?.content ?? { title: 'New Page', path: '/new-page', body: 'This is a new page.' }
  const permissions = expected?.revision?.permissions ?? { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
  const curr = page?.revisions[0]

  hasStatusAndHeaders(res, 201, expected?.headers ?? {})
  expect(res.headers.location).not.to.equal(undefined)
  expect(page).not.to.equal(null)
  expect(curr).to.containSubset({ content, permissions })

  if (expected?.file !== undefined) await isFile(curr?.file, expected.file)
  if (expected?.thumbnail !== undefined) await isFile(curr?.thumbnail, expected.thumbnail)

  return page
}

export default isPage
