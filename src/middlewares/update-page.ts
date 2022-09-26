import { Request, Response, NextFunction } from 'express'

const updatePage = function (req: Request, res: Response, next: NextFunction): void {
  const { page, revision } = req
  const permissionGranted = page?.revisions[0].permissions.canWrite(req.user, page.revisions)
  if (permissionGranted !== true && req.user === undefined) {
    res.set('WWW-Authenticate', 'Bearer error="invalid_token" error_description="The access token could not be verified."')
    res.status(401).send({ message: 'This method requires authentication.' })
  } else if (permissionGranted !== true) {
    res.status(403).send({ message: 'You do not have permission to update this page.' })
  } else {
    if (revision !== undefined) page?.addRevision(revision)
    next()
  }
}

export default updatePage
