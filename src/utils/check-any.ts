const checkAny = (claims: boolean[]): boolean => {
  const reducer = (acc: boolean, curr: boolean): boolean => acc || curr
  return claims.reduce(reducer, false)
}

export default checkAny
