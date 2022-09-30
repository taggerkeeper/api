import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import loadUserByIdAndRefresh from '../models/user/loaders/by-id-and-refresh.js'

const requireRefreshToken = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  const { refresh } = req.body
  const user = await loadUserByIdAndRefresh(req.params.uid, refresh)
  if (user === null) {
    res.set('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    res.status(401).send({ message: 'Could not verify refresh token.' })
  } else {
    req.user = user
    next()
  }
}

export default expressAsyncHandler(requireRefreshToken)
