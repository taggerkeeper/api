import { PageQuery } from './data.js'

const getRevisionsSubquery = (query?: PageQuery): any => {
  if (query?.revisions?.min === undefined && query?.revisions?.max === undefined) return false
  const { min, max } = query.revisions
  const subquery: any = {}
  if (max !== undefined) subquery[`revisions.${max}`] = { $exists: false }
  if (min !== undefined) subquery[`revisions.${min - 1}`] = { $exists: true }
  return subquery
}

export default getRevisionsSubquery
