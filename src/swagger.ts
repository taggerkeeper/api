import { Express } from 'express'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUI from 'swagger-ui-express'
import loadPackage from './utils/load-package.js'
import getAPIInfo from './utils/get-api-info.js'
import getEnvVar from './utils/get-env-var.js'

const setupSwagger = async (api: Express): Promise<void> => {
  const pkg = await loadPackage()

  if (pkg !== undefined) {
    const { root, base } = getAPIInfo(pkg)
    api.use(`${base}/docs`, swaggerUI.serve, swaggerUI.setup(swaggerJSDoc({
      swaggerDefinition: {
        openapi: '3.0.0',
        info: {
          title: getEnvVar('OPENAPI_TITLE') as string,
          version: pkg?.version ?? '1.0.0',
          description: pkg?.description,
          license: {
            name: 'Creatives Commons Attribution Sharealike 4.0 International',
            url: 'https://creativecommons.org/licenses/by-sa/4.0/'
          },
          contact: {
            name: pkg?.name,
            url: pkg?.homepage
          }
        },
        servers: [
          {
            url: root,
            description: getEnvVar('OPENAPI_DESC') as string
          }
        ]
      },
      apis: ['./src/routes/*.ts']
    })))
  }
}

export default setupSwagger
