import PublicRevisionData, { isPublicRevisionData } from '../revision/public.js'
import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface PublicPageData {
  _id?: string | object
  id?: string
  path?: string
  revisions: PublicRevisionData[]
  created?: Date
  updated?: Date
  trashed?: Date
}

const isPublicPageData = (obj: any): obj is PublicPageData => {
  if (!exists(obj) || typeof obj !== 'object') return false
  const { _id, id, revisions, created, updated, trashed } = obj
  const revisionChecks = Array.isArray(revisions) ? revisions.map((rev: any) => isPublicRevisionData(rev)) : [false]
  return checkAll([
    checkAny([!exists(_id), typeof _id === 'string', checkAll([typeof _id === 'object', !Array.isArray(_id)])]),
    checkAny([!exists(id), typeof id === 'string']),
    checkAll([exists(revisions), Array.isArray(revisions), ...revisionChecks]),
    checkAny([!exists(created), created?.constructor?.name === 'Date']),
    checkAny([!exists(updated), updated?.constructor?.name === 'Date']),
    checkAny([!exists(trashed), trashed?.constructor?.name === 'Date'])
  ])
}

export default PublicPageData
export { isPublicPageData }
