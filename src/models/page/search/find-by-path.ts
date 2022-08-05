import PageModel from '../model.js'
import PageData from '../data.js'
import User from '../../user/user.js'
import getSecuritySubquery from './get-security-subquery.js'

const findByPath = async (path: string, searcher?: User): Promise<PageData | undefined> => {
  const query = Object.assign({}, getSecuritySubquery(searcher), { path })
  return PageModel.findOne(query)
}

export default findByPath
