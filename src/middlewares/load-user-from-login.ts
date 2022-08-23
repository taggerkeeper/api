import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import loadUsersByEmail from '../models/user/loaders/by-email.js'

const loadUserFromLogin = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { addr, password, passcode } = req.body
    const users = addr === undefined ? undefined : await loadUsersByEmail(addr)
    for (const user of users ?? []) {
      const passwordCheck = password === undefined ? false : user.password.verify(password)
      const otpCheck = user.otp.enabled ? await user.otp.verify(passcode) : true
      if (passwordCheck && otpCheck) req.user = user
    }
  } catch (err) {
    console.error(err)
  }
  next()
}

export default expressAsyncHandler(loadUserFromLogin)
