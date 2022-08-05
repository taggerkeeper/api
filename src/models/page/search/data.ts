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
}

export { PageQuery }
