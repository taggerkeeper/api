import { PermissionLevel } from '../models/permissions/data.js'
import getFirstVal from './get-first-val.js'

const envVarDefaults: any = {
  PROTOCOL: { type: 'string', value: 'https' },
  DOMAIN: { type: 'string', value: 'localhost' },
  PORT: { type: 'number', value: 8080 },
  APIPATH: { type: 'string', value: '/' },
  CONNECTIONSTRING: { type: 'string', value: 'mongodb://localhost/taggerkeeper' },
  DEFAULT_READ_PERMISSIONS: { type: 'string', value: PermissionLevel.anyone },
  DEFAULT_WRITE_PERMISSIONS: { type: 'string', value: PermissionLevel.anyone },
  DEFAULT_QUERY_LIMIT: { type: 'number', value: 50 },
  MAX_QUERY_LIMIT: { type: 'number', value: 1000 },
  OPENAPI_TITLE: { type: 'string', value: 'Tagger Keeper API' },
  OPENAPI_DESC: { type: 'string', value: 'Example server.' },
  EMAIL_FROM: { type: 'string', value: 'Tagger Keeper API <api@taggerkeeper.com>' },
  MAILGUN_USERNAME: { type: 'string', value: 'your-mailgun-username' },
  MAILGUN_APIKEY: { type: 'string', value: 'your-mailgun-api-key' },
  MAILGUN_DOMAIN: { type: 'string', value: 'sandbox12345.mailgun.org' },
  MAILGUN_API: { type: 'string', value: 'https://api.mailgun.net'}
}

const getEnvVar = (varName: string): string | number | undefined => {
  const type = envVarDefaults[varName]?.type
  const processVal = process.env[varName]
  const defaultVal = envVarDefaults[varName]?.value

  if (defaultVal === undefined) return processVal ?? undefined
  if (type === 'number') return parseInt(getFirstVal(processVal, defaultVal))
  return getFirstVal(processVal, defaultVal)
}

export default getEnvVar
export { envVarDefaults }
