import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'
import Email from '../models/email/email.js'
import sendMail from '../emails/send.js'
import sendVerification from '../emails/verify.js'

const sendEmailVerification = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.email?.addr !== undefined) {
    const emailer = req.emailer ?? sendMail
    await sendVerification(req.email, req.ip, emailer)
  }
  next()
}

export default expressAsyncHandler(sendEmailVerification)
