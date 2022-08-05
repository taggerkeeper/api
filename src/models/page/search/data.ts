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
}

export { PageQuery }
