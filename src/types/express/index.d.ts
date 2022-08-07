import User from '../../models/user/user.js'

declare global {
  namespace Express {
    interface Request {
      subject?: User
    }
  }
}
