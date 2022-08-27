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

const parseCookieExpires = (cookie: CookieInfo, crumb: Record<string, string>): void => {
  const expires = new Date(crumb?.value)
  if (crumb?.value !== undefined && expires instanceof Date) cookie.expires = new Date(crumb?.value)
}

const parseCookieMaxAge = (cookie: CookieInfo, crumb: Record<string, string>): void => {
  const maxAge = crumb?.value === undefined ? NaN : parseInt(crumb.value)
  if (!isNaN(maxAge)) cookie.maxAge = maxAge
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
          case 'expires': parseCookieExpires(cookie, parsed); break
          case 'max-age': parseCookieMaxAge(cookie, parsed); break
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
