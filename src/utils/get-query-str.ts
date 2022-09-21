interface QueryObject {
  [key: string]: string | number | boolean
}

const getQueryStr = (obj: QueryObject): string => Object.keys(obj).map(key => `${key}=${encodeURIComponent(obj[key].toString())}`).join('&')

export default getQueryStr
