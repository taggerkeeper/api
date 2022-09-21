import * as sinon from 'sinon'
import Email from '../../models/email/email.js'
import User, { TokenSet } from '../../models/user/user.js'
import { PageQueryResultSet } from '../../models/page/search/data'

declare global {
  namespace Express {
    interface Request {
      user?: User
      subject?: User
      email?: Email
      emailer?: Function | sinon.SinonStub
      tokens?: TokenSet
      searchResults?: PageQueryResultSet
    }
  }
}
