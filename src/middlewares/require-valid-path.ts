import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import getPath from '../utils/get-path.js'
import validatePath from '../utils/validate-path.js'

const requireValidPath = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  const path = await getPath(req.originalUrl)
  const validation = validatePath(path)

  if (validation.isValid) {
    next()
  } else {
    res.status(400).send({ message: validation.reason, path })
  }
}

export default expressAsyncHandler(requireValidPath)
