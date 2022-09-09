import getEnvVar from './get-env-var.js'

const getConnStr = (): string => {
  const server = getEnvVar('MONGO_SERVER') as string
  const username = getEnvVar('MONGO_USERNAME') as string
  const password = getEnvVar('MONGO_PASSWORD') as string
  const collection = getEnvVar('MONGO_COLLECTION') as string
  return getEnvVar('MONGO_CONN_STR') as string ?? `mongodb://${username}:${password}@${server}/${collection}`
}

export default getConnStr
