const getPath = (originalUrl: string): string => {
  const root = 'pages'
  const actions = ['revisions']
  const queryIndex = originalUrl.indexOf('?')
  const sansQuery = queryIndex >= 0 ? originalUrl.substring(0, queryIndex) : originalUrl
  const elems = sansQuery.split('/').filter(elem => elem.length > 0)
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
