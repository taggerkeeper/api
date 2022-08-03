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
}

export default Page
