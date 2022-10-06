import { Request, Response, NextFunction } from 'express'
import { diffWords } from 'diff'

const diffRevisions = (req: Request, res: Response, next: NextFunction): void => {
  const { page, revision } = req
  if (page !== undefined && revision !== undefined && req.query.compare !== undefined) {
    const compare = page.getRevisionFromStr(req.query.compare as string)
    if (typeof compare !== 'string') {
      const a = revision.timestamp <= compare.timestamp ? revision : compare
      const b = revision.timestamp > compare.timestamp ? revision : compare
      req.revisionsDiff = {
        content: {
          title: diffWords(a.content.title, b.content.title),
          path: diffWords(a.content.path, b.content.path),
          body: diffWords(a.content.body, b.content.body)
        },
        permissions: {
          read: diffWords(a.permissions.read, b.permissions.read),
          write: diffWords(a.permissions.write, b.permissions.write)
        }
      }
    }
  }
  next()
}

export default diffRevisions
