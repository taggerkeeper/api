const checkAll = (claims: boolean[]): boolean => {
  for (const claim of claims) {
    if (!claim) return false
  }
  return true
}

export default checkAll
