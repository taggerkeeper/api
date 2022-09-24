import { Request, Response, NextFunction } from 'express'
import Content from '../models/content/content.js'
import Permissions from '../models/permissions/permissions.js'
import Revision from '../models/revision/revision.js'
import getEnvVar from '../utils/get-env-var.js'

const getContentFromBody = (req: Request): Content => {
  const { title, path, body } = req.body
  return new Content({ title, path, body })
}

const getPermissionsFromBody = (req: Request): Permissions => {
  const read = req.body['read-permissions'] ?? getEnvVar('DEFAULT_READ_PERMISSIONS')
  const write = req.body['write-permissions'] ?? getEnvVar('DEFAULT_WRITE_PERMISSIONS')
  return new Permissions({ read, write })
}

const getRevisionFromBody = (req: Request, res: Response, next: NextFunction): void => {
  const content = getContentFromBody(req)
  const permissions = getPermissionsFromBody(req)
  req.revision = new Revision({ content, permissions, editor: req.user?.getObj(), msg: req.body.msg, timestamp: new Date() })
  next()
}

export default getRevisionFromBody
