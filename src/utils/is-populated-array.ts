const isPopulatedArray = (arr: any): boolean => {
  if (!Array.isArray(arr)) return false
  return arr.length > 0
}

export default isPopulatedArray
