import { Request } from 'express'
import { PageQuery } from '../models/page/search/data.js'

type PageQuerySortOption = 'created' | '-created' | 'updated' | '-updated' | 'alphabetical' | '-alphabetical' | 'relevance'
type PageQueryNumericalField = 'created-before' | 'created-after' | 'updated-before' | 'updated-after' | 'revisions-minimum' | 'revisions-maximum' | 'limit' | 'offset'

const parsePageQueryDates = (req: Request, field: 'created' | 'updated'): undefined | { before?: Date, after?: Date } => {
  const before = parsePageQueryNumber(req, `${field}-before`)
  const after = parsePageQueryNumber(req, `${field}-after`)
  if (before === undefined && after === undefined) return undefined

  const obj: { before?: Date, after?: Date } = {}
  if (before !== undefined) obj.before = new Date(before)
  if (after !== undefined) obj.after = new Date(after)
  return obj
}

const parsePageQueryRevisions = (req: Request): undefined | { min?: number, max?: number } => {
  const min = parsePageQueryNumber(req, 'revisions-minimum')
  const max = parsePageQueryNumber(req, 'revisions-maximum')
  if (min === undefined && max === undefined) return undefined

  const obj: { min?: number, max?: number } = {}
  if (min !== undefined) obj.min = min
  if (max !== undefined) obj.max = max
  return obj
}

const parsePageQueryNumber = (req: Request, field: PageQueryNumericalField): undefined | number => {
  const num = parseInt(req.query[field] as string)
  return isNaN(num) ? undefined : num
}

const parsePageQuerySort = (req: Request): undefined | PageQuerySortOption => {
  const options = ['created', '-created', 'updated', '-updated', 'alphabetical', '-alphabetical', 'relevance']
  if (options.includes(req.query.sort as string)) return req.query.sort as PageQuerySortOption
  return undefined
}

const parsePageQuery = (req: Request): PageQuery => {
  const query: PageQuery = { trashed: req.query.trashed !== undefined }

  const created = parsePageQueryDates(req, 'created')
  const updated = parsePageQueryDates(req, 'updated')
  const revisions = parsePageQueryRevisions(req)
  if (created !== undefined) query.created = created
  if (updated !== undefined) query.updated = updated
  if (revisions !== undefined) query.revisions = revisions

  const limit = parsePageQueryNumber(req, 'limit')
  const offset = parsePageQueryNumber(req, 'offset')
  if (limit !== undefined) query.limit = limit
  if (offset !== undefined) query.offset = offset

  const sort = parsePageQuerySort(req)
  if (sort !== undefined) query.sort = sort

  if (req.query.text !== undefined) query.text = req.query.text as string

  return query
}

export default parsePageQuery
