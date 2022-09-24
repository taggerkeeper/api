import { PageQuery } from './data.js'

const getTimeSubquery = (query: PageQuery, name: 'created' | 'updated'): any => {
  if (query[name] === undefined) return false
  const subquery: any = name === 'created' ? { created: {} } : { updated: {} }
  if (query[name]?.before !== undefined) subquery[name].$lte = query[name]?.before
  if (query[name]?.after !== undefined) subquery[name].$gte = query[name]?.after
  return subquery
}

export default getTimeSubquery
