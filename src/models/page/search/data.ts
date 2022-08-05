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

export { PageQuery }
