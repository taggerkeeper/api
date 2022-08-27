const parseKeyValPair = (orig: string, asObj = true): Record<string, string> | null => {
  const match = orig.match(/^(.*?)\s*?=\s*?["“'‘]?(.*?)["”'’]?”?$/i)
  if (match === null || match.length < 2) return null
  const key = match[1].trim()
  const value = match[2].trim()
  const obj: Record<string, string> = {}
  obj[key] = value
  return asObj ? obj : { key, value }
}

export default parseKeyValPair
