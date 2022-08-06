import getEnvVar from './get-env-var.js'
import loadPackage from './load-package.js'

const getRoot = async (): Promise<string> => {
  const protocol = getEnvVar('PROTOCOL') as string
  const domain = getEnvVar('DOMAIN') as string
  const port = getEnvVar('PORT') as number
  const path = getEnvVar('APIPATH') as string
  const pkg = await loadPackage()

  const origPathElements = path !== undefined ? path.split('/').filter((elem: string) => elem.length > 0) : []
  const versionElements = pkg !== undefined ? pkg.version.split('.') : [1]
  const pathElements = [...origPathElements.map(elem => `/${elem}`), `/v${versionElements[0]}`]

  return `${protocol}://${domain}${port === 80 ? '' : `:${port}`}${pathElements.join('')}`
}

export default getRoot
