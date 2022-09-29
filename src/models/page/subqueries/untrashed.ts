import User from '../../user/user.js'

const getUntrashedSubquery = (searcher?: User): any => {
  return searcher?.admin === true ? false : { trashed: { $exists: false } }
}

export default getUntrashedSubquery
