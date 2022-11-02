import rfdc from 'rfdc'
import { RevisionsDiff } from '../models/revision/revision.js'

const clone = rfdc()

const stripUndefinedAddedRemoved =  (diff: RevisionsDiff): RevisionsDiff => {
  const cpy = clone(diff)
  const arrs = [cpy.content.title, cpy.content.path, cpy.content.body, cpy.permissions.read, cpy.permissions.write]
  for (const arr of arrs) {
    for (const change of arr) {
      if (change.added === undefined) delete change.added
      if (change.removed === undefined) delete change.removed
    }
  }
  return cpy
}

export default stripUndefinedAddedRemoved
