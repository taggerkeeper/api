import { Request, Response, NextFunction } from 'express'

const requirePageRead = function (req: Request, res: Response, next: NextFunction): void {
  if (req.page?.revisions[0].permissions === undefined) {
    res.status(404).send({ message: 'Page not found.' })
  } else {
    const check = req.page?.revisions[0].permissions.canRead(req.user, req.page?.revisions)
    if (!check && req.user === undefined) {
      res.set('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
      res.status(401).send({ message: 'This method requires authentication.' })
    } else if (!check) {
      res.status(403).send({ message: 'You do not have permission to view this page.' })
    } else {
      next()
    }
  }
}

export default requirePageRead
