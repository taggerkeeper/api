import { expect } from 'chai'

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
}

export default isFile
export { FileExpectations }
