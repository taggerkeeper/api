import express from 'express'

const PORT = 8080

const api = express()

api.get('/', (req, res) => {
  res.send({ message: 'Hello, world! '})
})

const server = api.listen(PORT, () => {
  console.log(`Tagger Keeper API is now running at port ${PORT}`)
})
