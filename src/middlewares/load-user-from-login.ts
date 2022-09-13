import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import loadUsersByEmail from '../models/user/loaders/by-email.js'

const loadUserFromLogin = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { addr, password, passcode } = req.body
    const users = addr === undefined ? undefined : await loadUsersByEmail(addr)
    if (users === undefined) {
      res.status(400).send({ message: 'You must provide a verified email address to authenticate.' })
    } else {
      for (const user of users ?? []) {
        const passwordCheck = password === undefined ? false : user.password.verify(password)
        const otpCheck = user.otp.enabled ? await user.otp.verify(passcode) : true
        if (passwordCheck && otpCheck) {
          req.user = user
          next()
        } else {
          res.status(400).send({ message: 'Authentication failed.' })
        }
      }
    }
  } catch (err) {
    console.error(err)
    res.status(500).send({ message: 'An unexpected error occurred.' })
  }
}

export default expressAsyncHandler(loadUserFromLogin)
