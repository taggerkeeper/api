import { expect } from 'chai'
import UserData from '../../../models/user/data.js'

const isUser = (obj: any, expected: UserData): void => {
  expect(obj.name).to.equal(expected.name)
  expect(obj.active).to.equal(expected.active)
  expect(obj.admin).to.equal(expected.admin)
  expect(obj.id).not.to.equal(expected.id)
}

export default isUser
