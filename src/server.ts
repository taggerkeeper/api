import express, { Router } from 'express'
import mongoose from 'mongoose'

import userRouter from './routes/users.js'

import setupSwagger from './swagger.js'

import getEnvVar from './utils/get-env-var.js'
import loadPackage from './utils/load-package.js'
import getAPIInfo from './utils/get-api-info.js'

const pkg = await loadPackage()
const port: number = getEnvVar('PORT') as number
const connectionString: string = getEnvVar('CONNECTION_STRING') as string
const { root, base } = getAPIInfo(pkg)

// Connect to MongoDB
await mongoose.connect(connectionString)

// Create server
const api = express()
api.use(express.json())
api.use(express.urlencoded({ extended: true }))

// Set up Swagger documentation
await setupSwagger(api)

// Connect routes
const endpoints: { [key: string]: Router } = {
  users: userRouter
}

for (const endpoint of Object.keys(endpoints)) {
  api.use(`${base}/${endpoint}`, endpoints[endpoint])
}

// GET /
api.get(`${base}/`, (req, res) => {
  res.send({
    endpoints: Object.keys(endpoints).map(endpoint => `${root}/${endpoint}`),
    documentation: `${root}/docs`
  })
})

// Start server
const server = api.listen(port, () => {
  console.log(`Tagger Keeper API is now running at port ${port}`)
  console.log(`Entrypoint can be found at <${root}>`)
})

/**
 * Close the server gracefully.
 * @param {*} signal - The signal passed from the process.
 */

const closeGracefully = (signal: any): void => {
  console.log(`Recieved signal to terminate: ${signal as string}`)
  server.close(() => {
    mongoose.disconnect()
      .then(() => {
        console.log('Database connections closed')
        console.log('HTTP server closed')
        process.exit(0)
      })
      .catch(err => {
        console.error(err)
        process.exit(0)
      })
  })
}

process.on('SIGINT', closeGracefully)
process.on('SIGTERM', closeGracefully)

export default api
