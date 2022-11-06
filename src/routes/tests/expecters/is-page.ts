import { expect } from 'chai'
import { Response } from 'superagent'
import hasStatusAndHeaders from './has-status-and-headers.js'
import RevisionData from '../../../models/revision/data.js'
import PageModel from '../../../models/page/model.js'
import { PermissionLevel } from '../../../models/permissions/data.js'

interface ExpectedPage {
  headers: { [key: string]: string | RegExp }
  revision?: RevisionData
}

const isPage = async (res: Response, expected?: ExpectedPage): Promise<void> => {
  const elems = res.headers.location.split('/')
  const id = elems[elems.length - 1]
  const page = await PageModel.findById(id)
  const content = expected?.revision?.content ?? { title: 'New Page', path: '/new-page', body: 'This is a new page.' }
  const permissions = expected?.revision?.permissions ?? { read: PermissionLevel.anyone, write: PermissionLevel.anyone }
  const curr = page?.revisions[0]

  hasStatusAndHeaders(res, 201, expected?.headers ?? {})
  expect(res.headers.location).not.to.equal(undefined)
  expect(page).not.to.equal(null)
  expect(curr).to.containSubset({ content, permissions })
}

export default isPage
