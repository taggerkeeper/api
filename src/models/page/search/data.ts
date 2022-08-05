import Page from '../page.js'

interface PageQuery {
  created?: {
    before?: Date
    after?: Date
  }
  updated?: {
    before?: Date
    after?: Date
  }
  revisions?: {
    max?: number
    min?: number
  }
  text?: string
  limit?: number
  offset?: number
  sort?: 'created' | '-created' | 'updated' | '-updated' | 'alphabetical' | '-alphabetical' | 'relevance'
}

interface PageSearchOptions {
  sort: string
  offset: number
  limit: number
}

interface PageQueryResultSet {
  total: number
  start: number
  end: number
  pages: Page[]
}

export { PageQuery, PageSearchOptions, PageQueryResultSet }
