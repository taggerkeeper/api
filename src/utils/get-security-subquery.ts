import { PermissionLevel } from '../models/permissions/data.js'
import User from '../models/user/user.js'
import exists from './exists.js'

const getSecuritySubquery = (searcher?: User): any => {
  if (searcher?.admin === true) return {}

  const levels = {
    anyone: { 'revisions.0.permissions.read': PermissionLevel.anyone },
    authenticated: { 'revisions.0.permissions.read': PermissionLevel.authenticated },
    editor: { 'revisions.0.permissions.read': PermissionLevel.editor }
  }
  const isEditor = { 'revisions.editor': searcher?.id }

  if (!exists(searcher)) return levels.anyone
  return { $or: [levels.anyone, levels.authenticated, { $and: [levels.editor, isEditor] }] }
}

export default getSecuritySubquery
