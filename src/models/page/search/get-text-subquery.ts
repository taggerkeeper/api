import { PageQuery } from './data.js'

const getTextSubquery = (query?: PageQuery): any => {
  if (query?.text === undefined) return false
  return { $text: { $search: query.text, $caseSensitive: false, $diacriticSensitive: false } }
}

export default getTextSubquery
