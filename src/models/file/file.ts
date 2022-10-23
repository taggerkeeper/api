import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import getEnvVar from '../../utils/get-env-var.js'
import FileData, { isFileData } from './data.js'
import PublicFileData from './public'

class File {
  location: string
  key: string
  mime: string
  size: number

  constructor (data: FileData | Express.MulterS3.File) {
    this.location = data.location
    this.key = data.key
    this.mime = isFileData(data) ? data.mime : data.contentType
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

  getPublicObj (): PublicFileData {
    const { location, key, mime } = this
    const size = { bytes: this.size, str: this.reportSize() }
    return { location, key, mime, size }
  }

  async delete (): Promise<void> {
    const client = File.getS3Client()
    const Bucket = getEnvVar('S3_BUCKET') as string
    const command = new DeleteObjectCommand({ Bucket, Key: this.key })

    try {
      await client.send(command)
    } catch (err) {
      console.error(err)
    }
  }

  static getS3Client (): S3Client {
    const accessKeyId = getEnvVar('S3_API_KEY') as string
    const secretAccessKey = getEnvVar('S3_API_SECRET') as string
    const region = getEnvVar('S3_REGION') as string
    const endpoint = (getEnvVar('S3_ENDPOINT') as string).replace('S3_REGION', region)
    return new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      endpoint,
      region
    })
  }
}

export default File
