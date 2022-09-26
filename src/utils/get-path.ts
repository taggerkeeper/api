import loadPackage from './load-package.js'
import getAPIInfo from './get-api-info.js'

const getPath = async (originalUrl: string): Promise<string> => {
  const pkg = await loadPackage()
  const { base } = getAPIInfo(pkg)
  const root = `${base}/pages`
  const actions = ['revisions']
  const queryIndex = originalUrl.indexOf('?')
  const sansQuery = queryIndex >= 0 ? originalUrl.substring(0, queryIndex) : originalUrl
  const sansRoot = sansQuery.startsWith(root) ? sansQuery.substring(root.length) : sansQuery
  const elems = sansRoot.split('/').filter(elem => elem.length > 0)
  let actionFound = false
  const pathElems = elems.map((elem, index) => {
    if (elem === root && index === 0) { return null }
    if (actions.includes(elem)) { actionFound = true; return null }
    if (actionFound) return null
    return elem
  }).filter(elem => elem !== null)
  return `/${pathElems.join('/')}`
}

export default getPath
