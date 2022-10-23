import multer from 'multer'
import multerS3 from 'multer-s3'
import File from '../models/file/file.js'
import getFilename from '../utils/get-filename.js'
import getEnvVar from '../utils/get-env-var.js'

const s3 = File.getS3Client()

const uploadFile = multer({
  storage: multerS3({
    s3,
    bucket: getEnvVar('S3_BUCKET') as string,
    acl: getEnvVar('S3_ACL') as string,
    key: (req: Express.Request, file: Express.Multer.File, callback: Function) => {
      const { base, ext } = getFilename(file.originalname)
      callback(null, `${base}.${Math.round((Date.now())/1000).toString()}.${ext}`)
    }
  })
})

export default uploadFile.fields([{ name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }])
