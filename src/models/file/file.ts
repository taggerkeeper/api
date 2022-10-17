import FileData from './data.js'

class File {
  location: string
  key: string
  mime: string
  size: number

  constructor (data: FileData) {
    this.location = data.location
    this.key = data.key
    this.mime = data.mime
    this.size = data.size
  }
}

export default File
