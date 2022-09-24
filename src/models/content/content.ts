import slugify from 'slugify'
import ContentData from './data.js'

class Content {
  title: string
  path: string
  body: string

  constructor (options: ContentData) {
    this.title = options.title
    this.path = options.path ?? `/${slugify(this.title.toLowerCase())}`
    this.body = options.body
  }

  getObj (): ContentData {
    const { title, path, body } = this
    return { title, path, body }
  }
}

export default Content
