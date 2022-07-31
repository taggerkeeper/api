import Content from '../content/content.js'
import User from '../user/user.js'

class Revision {
  content: Content
  editor: User
  msg: string
  timestamp: Date

  constructor (content: Content, editor: User, msg: string) {
    this.content = content
    this.editor = editor
    this.msg = msg
    this.timestamp = new Date()
  }
}

export default Revision
