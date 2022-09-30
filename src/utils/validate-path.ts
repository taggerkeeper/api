import andStr from './and-str.js'
import checkAll from './check-all.js'
import checkAny from './check-any.js'
import exists from './exists.js'
import getEnvVar from './get-env-var.js'

interface PathValidation {
  isValid: boolean
  reason?: string
}

const isPathValidation = (obj: any): obj is PathValidation => {
  if (!exists(obj) || typeof obj !== 'object') return false
  const { isValid, reason } = obj
  return checkAll([
    checkAny([isValid === true, isValid === false]),
    checkAny([reason === undefined, typeof reason === 'string'])
  ])
}

const validatePath = (path: string): PathValidation => {
  const reserved = (getEnvVar('RESERVED_PATHS') as string).split(',').map(path => path.trim())
  const elements = path.split('/').map(el => el.trim()).filter(el => el.length > 0)
  if (elements.length < 1) return { isValid: false, reason: 'A null string is not a valid path.' }
  if (reserved.includes(elements[0])) return { isValid: false, reason: `First element cannot be any of ${andStr(reserved, 'or')}.` }
  return { isValid: true }
}

export default validatePath
export { PathValidation, isPathValidation }
