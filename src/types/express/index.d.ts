import * as sinon from 'sinon'
import { Change } from 'diff'
import Email from '../../models/email/email.js'
import User, { TokenSet } from '../../models/user/user.js'
import Revision from '../../models/revision/revision.js'
import Page from '../../models/page/page.js'
import { PageQueryResultSet } from '../../models/page/search/data'

interface RevisionDiff {
  content: {
    title: Change[]
    path: Change[]
    body: Change[]
  }
  permissions: {
    read: Change[]
    write: Change[]
  }
}

declare global {
  namespace Express {
    interface Request {
      revisionsDiff?: RevisionDiff
      email?: Email
      emailer?: Function | sinon.SinonStub
      page?: Page
      revision?: Revision
      searchResults?: PageQueryResultSet
      subject?: User
      tokens?: TokenSet
      user?: User
    }
  }
}
