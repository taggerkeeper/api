import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import { isPublicUserData } from '../models/user/public.js'
import loadUserById from '../models/user/loaders/by-id.js'
import getEnvVar from '../utils/get-env-var.js'

const loadUserFromAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.substring(7)
  try {
    if (token !== '' && token !== undefined) {
      const payload = jwt.verify(token, getEnvVar('JWT_SECRET') as string)
      const user = isPublicUserData(payload) ? await loadUserById(payload.id) : undefined
      req.user = user === null ? undefined : user
    }
  } catch (err) {
    console.error(err)
  }
  next()
}

export default expressAsyncHandler(loadUserFromAccessToken)
