const checkAll = (claims: boolean[]): boolean => {
  for (let claim of claims) {
    if (!claim) return false
  }
  return true
}

export default checkAll
