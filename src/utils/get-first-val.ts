import exists from './exists.js'

const getFirstVal = (...vals: any[]): any => {
  if (exists(vals[0])) return vals[0]
  const remaining = vals.slice(1)
  if (remaining.length === 0) return undefined
  return getFirstVal(...remaining)
}

export default getFirstVal
