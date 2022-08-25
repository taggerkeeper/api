import mongoose from 'mongoose'

const clearDatabase = async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map(async (coll) => { await coll.deleteMany({}) }))
}

beforeEach(async () => { await clearDatabase() })
afterEach(async () => { await clearDatabase() })