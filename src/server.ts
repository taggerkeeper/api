import express from 'express'
import mongoose from 'mongoose'

const PORT = 8080
const connectionString: string = process.env.CONNECTIONSTRING || 'mongodb://localhost/taggerkeeper'

await mongoose.connect(connectionString)

const api = express()

api.get('/', (req, res) => {
  res.send({ message: 'Hello, world! '})
})

const server = api.listen(PORT, () => {
  console.log(`Tagger Keeper API is now running at port ${PORT}`)
})

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
