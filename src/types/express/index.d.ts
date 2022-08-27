import * as sinon from 'sinon'
import Email from '../../models/email/email.js'
import User from '../../models/user/user.js'

declare global {
  namespace Express {
    interface Request {
      user?: User
      subject?: User
      email?: Email
      emailer?: Function | sinon.SinonStub
      tokens: {
        access: string
        refresh: string
      }
    }
  }
}
