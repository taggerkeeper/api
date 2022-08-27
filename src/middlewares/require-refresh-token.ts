import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import loadUserByIdAndRefresh from '../models/user/loaders/by-id-and-refresh.js'

const requireRefreshToken = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  const { refresh } = req.body
  const user = await loadUserByIdAndRefresh(req.params.uid, refresh)
  if (user === null) {
    res.status(400).send({ message: 'Could not verify refresh token.' })
  } else {
    next()
  }
}

export default expressAsyncHandler(requireRefreshToken)
