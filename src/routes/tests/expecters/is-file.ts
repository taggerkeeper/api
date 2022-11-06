import { expect } from 'chai'
import axios from 'axios'

interface FileExpectations {
  key?: string | RegExp
  size?: number
  mime?: string | RegExp
}

const isFile = async (obj: any, expectations: FileExpectations): Promise<void> => {
  const { key, size, mime } = expectations
  if (key !== undefined && typeof key === 'string') expect(obj.key).to.equal(key)
  if (key !== undefined && typeof key !== 'string') expect(obj.key).to.match(key)
  if (size !== undefined) expect(obj.size).to.equal(size)
  if (mime !== undefined && typeof mime === 'string') expect(obj.mime).to.equal(mime)
  if (mime !== undefined && typeof mime !== 'string') expect(obj.mime).to.match(mime)

  expect(typeof obj.location).to.equal('string')
  const check = await axios.get(obj.location)
  expect(check.status).to.equal(200)
  if (mime !== undefined && typeof mime === 'string') expect(check.headers['content-type']).to.equal(mime)
  if (mime !== undefined && typeof mime !== 'string') expect(check.headers['content-type']).to.match(mime)
  expect(check.headers['content-length']).to.equal(size?.toString())
}

export default isFile
export { FileExpectations }
