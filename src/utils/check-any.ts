const checkAny = (claims: boolean[]): boolean => {
  for (let claim of claims) {
    if (claim) return true
  }
  return false
}

export default checkAny
