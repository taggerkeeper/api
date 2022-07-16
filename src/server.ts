import express from 'express'
import mongoose from 'mongoose'

// Parse environment variables into something useful
const { PORT, CONNECTIONSTRING } = process.env
const port: number = PORT ? parseInt(PORT) : 8080
const connectionString: string = CONNECTIONSTRING || 'mongodb://localhost/taggerkeeper'

// Connect to MongoDB
await mongoose.connect(connectionString)

const api = express()

// GET /
api.get('/', (req, res) => {
  res.send({ message: 'Hello, world! '})
})

// Start server
const server = api.listen(port, () => {
  console.log(`Tagger Keeper API is now running at port ${port}`)
})

/**
 * Close the server gracefully.
 * @param {*} signal - The signal passed from the process.
 */

const closeGracefully = (signal: any) => {
  console.log(`Recieved signal to terminate: ${signal}`)
  server.close(async () => {
    await mongoose.disconnect()
    console.log('Database connections closed')
    console.log('HTTP server closed')
    process.exit(0)
  })
}

process.on('SIGINT', closeGracefully)
process.on('SIGTERM', closeGracefully)
