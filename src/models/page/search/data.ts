interface PageQuery {
  created?: {
    before?: Date
    after?: Date
  }
  updated?: {
    before?: Date
    after?: Date
  }
}

export { PageQuery }
