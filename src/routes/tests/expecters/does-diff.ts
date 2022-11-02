import { expect } from 'chai'
import Revision from '../../../models/revision/revision.js'

const doesDiff = (diff: any, a: Revision, b: Revision): void => {
  const expected = a.diff(b)
  expect(diff).to.deep.equal(expected)
}

export default doesDiff
