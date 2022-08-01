import Revision from '../revision/revision.js'
import exists from '../../utils/exists.js'

interface IPage {
  revisions: Revision[]
  created?: Date
  updated?: Date
  trashed?: Date
}

class Page {
  revisions: Revision[]
  created: Date
  updated: Date
  trashed?: Date

  constructor (data?: IPage) {
    this.revisions = data?.revisions ?? []
    this.created = data?.created ?? new Date()
    this.updated = data?.updated ?? new Date()
    if (exists(data?.trashed)) this.trashed = data?.trashed
  }
}

export default Page
export { IPage }
