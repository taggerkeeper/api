import { NPMPackage } from './load-package.js'
import getEnvVar from './get-env-var.js'

interface APIInfo {
  host: string
  root: string
  base: string
}

const getAPIInfo = (pkg: NPMPackage): APIInfo => {
  const protocol = getEnvVar('PROTOCOL') as string
  const domain = getEnvVar('DOMAIN') as string
  const port = getEnvVar('PORT') as number
  const path = getEnvVar('APIPATH') as string

  const origPathElements = path !== undefined ? path.split('/').filter((elem: string) => elem.length > 0) : []
  const versionElements = pkg !== undefined ? pkg.version.split('.') : [1]
  const pathElements = [...origPathElements.map(elem => `/${elem}`), `/v${versionElements[0]}`]

  const host = `${protocol}://${domain}${port === 80 ? '' : `:${port}`}`
  const base = pathElements.join('')
  const root = `${host}${base}`
  return { host, root, base }
}

export default getAPIInfo
export { APIInfo }
