const getFilename = (filename: string): { base: string, ext: string } => {
  const fn = filename.substring(filename.lastIndexOf('/') + 1)
  const parts = fn.split('.')
  const base = parts.length > 1 ? parts.slice(0, parts.length - 1) : parts
  const ext = parts.length > 1 ? parts[parts.length - 1] : ''
  return { base: base.join('.'), ext }
}

export default getFilename
