import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user/user.js'
import { isPublicUserData } from '../models/user/public.js'
import getEnvVar from '../utils/get-env-var.js'

const getUser = function (req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.substring(7)
  try {
    if (token !== undefined && token !== '') {
      const payload = jwt.verify(token, getEnvVar('JWT_SECRET') as string)
      if (payload !== undefined && isPublicUserData(payload)) req.user = new User(payload)
    }
  } catch {}
  next()
}

export default getUser
