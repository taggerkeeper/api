import Revision from '../revision/revision.js'
import PageData from './data.js'
import exists from '../../utils/exists.js'
import getId from '../../utils/get-id.js'

class Page {
  id?: string
  revisions: Revision[]
  created: Date
  updated: Date
  trashed?: Date

  constructor (data?: PageData) {
    this.revisions = data?.revisions === undefined
      ? []
      : data.revisions.map(r => r.constructor.name === 'Revision' ? r as Revision : new Revision(r))
    this.created = data?.created ?? new Date()
    this.updated = data?.updated ?? new Date()
    if (exists(data?.trashed)) this.trashed = data?.trashed
    const id = getId(data)
    if (id !== null) this.id = id
  }

  getObj (): PageData {
    const obj: PageData = {
      revisions: this.revisions.map(revision => revision.getObj()),
      created: this.created,
      updated: this.updated
    }
    if (this.trashed !== undefined) obj.trashed = this.trashed
    if (this.id !== undefined) obj.id = this.id
    return obj
  }
}

export default Page
