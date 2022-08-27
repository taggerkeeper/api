import parseKeyValPair from './key-val.js'

interface CookieInfo {
  name: string
  value: string
  expires?: Date
  maxAge?: number
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: string
}

const parseCookie = (set: string): CookieInfo | undefined => {
  const crumbs = set.split(';').map(crumb => crumb.trim())
  const basic = parseKeyValPair(crumbs[0], false)
  if (basic === null) return undefined
  const cookie: CookieInfo = { name: basic.key, value: basic.value }

  for (let i = 1; i < crumbs.length; i++) {
    const parsed = parseKeyValPair(crumbs[i], false)
    switch (crumbs[i].toLowerCase()) {
      case 'secure': cookie.secure = true; break
      case 'httponly': cookie.httpOnly = true; break
      default:
        switch (parsed?.key.toLowerCase()) {
          case 'expires':
            const expires = new Date(parsed?.value)
            if (parsed?.value !== undefined && expires instanceof Date) cookie.expires = expires
            break
          case 'max-age':
            const maxAge = parsed?.value === undefined ? NaN : parseInt(parsed.value)
            if (maxAge !== NaN) cookie.maxAge = maxAge
            break
          case 'domain': cookie.domain = parsed?.value; break
          case 'path': cookie.path = parsed?.value; break
          case 'samesite': cookie.sameSite = parsed?.value; break
          default: break
        }
        break
    }
  }

  return cookie
}

export default parseCookie
export { CookieInfo }
