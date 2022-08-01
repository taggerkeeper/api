import slugify from 'slugify'

interface IContent {
  title: string
  path?: string
  body: string
}

class Content {
  title: string
  path: string
  body: string

  constructor (options: IContent) {
    this.title = options.title
    this.path = options.path ?? `/${slugify(this.title)}`
    this.body = options.body
  }
}

export default Content
export { IContent }
