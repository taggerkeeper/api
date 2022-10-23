import { Request, Response, NextFunction } from 'express'
import isPopulatedArray from '../utils/is-populated-array.js'
import File from '../models/file/file.js'

const addFilesToRevision = (req: Request, res: Response, next: NextFunction): void => {
  if (req.files !== undefined && req.revision !== undefined) {
    const files = (req.files as { [fieldname: string]: Express.MulterS3.File[] })['file']
    const thumbnails = (req.files as { [fieldname: string]: Express.MulterS3.File[] })['thumbnail']
    if (isPopulatedArray(files)) req.revision.file = new File(files[0])
    if (isPopulatedArray(thumbnails)) req.revision.thumbnail = new File(thumbnails[0])
  }
  next()
}

export default addFilesToRevision
