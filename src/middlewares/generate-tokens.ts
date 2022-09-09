import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'

const generateTokens = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.user === undefined) {
    res.status(401).send({ message: 'This method requires authentication' })
  } else {
    req.tokens = await req.user.generateTokens()
    next()
  }
}

export default expressAsyncHandler(generateTokens)
