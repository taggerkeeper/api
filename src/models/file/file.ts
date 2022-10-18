import { S3Client } from '@aws-sdk/client-s3'
import getEnvVar from '../../utils/get-env-var.js'
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

  reportSize (): string {
    const { size } = this
    if (size < 1000) {
      return `${size} B`
    } else if (size < 1000000) {
      const kb = size / 1000
      return `${Math.round(kb * 10) / 10} kB`
    } else if (size < 1000000000) {
      const mb = size / 1000000
      return `${Math.round(mb * 10) / 10} MB`
    } else if (size !== undefined) {
      const gb = size / 1000000000
      return `${Math.round(gb * 10) / 10} GB`
    } else {
      return '0 B'
    }
  }

  getObj (): FileData {
    const { location, key, mime, size } = this
    return { location, key, mime, size }
  }

  static getS3Client(): S3Client {
    const accessKeyId = getEnvVar('S3_API_KEY') as string
    const secretAccessKey = getEnvVar('S3_API_SECRET') as string
    const region = getEnvVar('S3_REGION') as string
    return new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      region
    })
  }
}

export default File
