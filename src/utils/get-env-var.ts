import { PermissionLevel } from '../models/permissions/data.js'
import getFirstVal from './get-first-val.js'

const envVarDefaults: any = {
  PROTOCOL: { type: 'string', value: 'https' },
  DOMAIN: { type: 'string', value: 'localhost' },
  PORT: { type: 'number', value: 8080 },
  API_PATH: { type: 'string', value: '/' },
  DEFAULT_READ_PERMISSIONS: { type: 'string', value: PermissionLevel.anyone },
  DEFAULT_WRITE_PERMISSIONS: { type: 'string', value: PermissionLevel.anyone },
  DEFAULT_QUERY_LIMIT: { type: 'number', value: 50 },
  MAX_QUERY_LIMIT: { type: 'number', value: 1000 },
  JWT_SECRET: { type: 'string', value: 'long-secret-string' },
  JWT_EXPIRES: { type: 'number', value: 300 },
  REFRESH_EXPIRES: { type: 'number', value: 86400000 },
  OPENAPI_TITLE: { type: 'string', value: 'Tagger Keeper API' },
  OPENAPI_DESC: { type: 'string', value: 'Example server.' },
  EMAIL_FROM: { type: 'string', value: 'Tagger Keeper API <api@taggerkeeper.com>' },
  MAILGUN_USERNAME: { type: 'string', value: 'your-mailgun-username' },
  MAILGUN_APIKEY: { type: 'string', value: 'your-mailgun-api-key' },
  MAILGUN_DOMAIN: { type: 'string', value: 'sandbox12345.mailgun.org' },
  MAILGUN_API: { type: 'string', value: 'https://api.mailgun.net' },
  MONGO_SERVER: { type: 'string', value: 'localhost' },
  MONGO_USERNAME: { type: 'string', value: 'root' },
  MONGO_PASSWORD: { type: 'string', value: 'password' },
  MONGO_COLLECTION: { type: 'string', value: 'taggerkeeper' },
  S3_ENDPOINT: { type: 'string', value: 'https://s3.S3_REGION.amazonaws.com' },
  S3_API_KEY: { type: 'string', value: 'S3_API_KEY' },
  S3_API_SECRET: { type: 'string', value: 'S3_API_SECRET' },
  S3_REGION: { type: 'string', value: 'us-east-1' },
  S3_BUCKET: { type: 'string', value: 'taggerkeeper' },
  RESERVED_PATHS: { type: 'string', value: 'login,logout,dashboard,connect' }
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
