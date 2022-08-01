const checkAll = (claims: boolean[]): Boolean => {
  const reducer = (acc: boolean, curr: boolean): boolean => acc && curr
  return claims.reduce(reducer, true)
}

export default checkAll
