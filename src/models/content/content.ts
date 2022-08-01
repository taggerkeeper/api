import slugify from 'slugify'

interface ContentConstructorOptions {
  title: string
  path?: string
  body: string
}

class Content {
  title: string
  path: string
  body: string

  constructor (options: ContentConstructorOptions) {
    this.title = options.title
    this.path = options.path ?? `/${slugify(this.title)}`
    this.body = options.body
  }
}

export default Content
