const stripQueryStr = (orig: string): string => {
  const index = orig.indexOf('?')
  return index > -1 ? orig.substring(0, index) : orig
}

export default stripQueryStr
