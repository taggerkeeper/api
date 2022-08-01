import Revision from '../revision/revision.js'

class Page {
  revisions: Revision[]
  created: Date
  updated: Date
  trashed?: Date

  constructor (revisions: Revision[]) {
    this.revisions = revisions
    this.created = new Date()
    this.updated = new Date()
  }
}

export default Page
