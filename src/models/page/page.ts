import Content from '../content/content.js'
import Permissions from '../permissions/permissions.js'
import Revision from '../revision/revision.js'
import RevisionData from '../revision/data.js'
import User from '../user/user.js'
import PageData from './data.js'
import exists from '../../utils/exists.js'

interface PageConstructorOptions {
  revisions: Revision[] | RevisionData[]
  created?: Date
  updated?: Date
  trashed?: Date
}

class Page {
  revisions: Revision[]
  created: Date
  updated: Date
  trashed?: Date

  constructor (data?: PageConstructorOptions) {
    this.revisions = data?.revisions === undefined
      ? []
      : data.revisions.map(r => r.constructor.name === 'Revision' ? r as Revision : new Revision(r))
    this.created = data?.created ?? new Date()
    this.updated = data?.updated ?? new Date()
    if (exists(data?.trashed)) this.trashed = data?.trashed
  }

  static loadObject (record: PageData): Page {
    const page = new Page({
      revisions: record.revisions.map(r => {
        const { msg, timestamp } = r
        const content = new Content(r.content)
        const permissions = new Permissions(r.permissions)
        const editor = typeof r.editor === 'string' || r.editor === undefined ? undefined : User.loadObject(r.editor)
        return new Revision({ content, permissions, editor, msg, timestamp })
      }),
      created: record.created,
      updated: record.updated
    })
    if (exists(record.trashed)) page.trashed = record.trashed
    return page
  }
}

export default Page
