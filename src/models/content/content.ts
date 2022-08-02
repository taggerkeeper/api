import slugify from 'slugify'
import ContentData from './data.js'

class Content {
  title: string
  path: string
  body: string

  constructor (options: ContentData) {
    this.title = options.title
    this.path = options.path ?? `/${slugify(this.title)}`
    this.body = options.body
  }
}

export default Content
