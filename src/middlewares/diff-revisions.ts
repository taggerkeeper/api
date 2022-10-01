import { Request, Response, NextFunction } from 'express'
import { diffWords } from 'diff'

const diffRevisions = (req: Request, res: Response, next: NextFunction): void => {
  if (req.page !== undefined) {
    const indices = [
      parseInt(req.params.revision),
      parseInt(req.query.compare as string)
    ].filter(index => !isNaN(index) && index <= (req.page?.revisions.length ?? 0)).map(index => index - 1)
    if (indices.length === 2) {
      const a = req.page.revisions[Math.min(...indices)]
      const b = req.page.revisions[Math.max(...indices)]
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
