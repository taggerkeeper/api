const parseKeyValPair = (orig: string): Record<string, string> | null => {
  const match = orig.match(/^(.*?)\s*?=\s*?["“'‘]?(.*?)["”'’]?”?$/i)
  if (match === null || match.length < 2) return null
  const obj: Record<string, string> = {}
  obj[match[1].trim()] = match[2].trim()
  return obj
}

export default parseKeyValPair
