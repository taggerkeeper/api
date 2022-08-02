const checkAny = (claims: boolean[]): boolean => {
  for (const claim of claims) {
    if (claim) return true
  }
  return false
}

export default checkAny
