import { expect } from 'chai'
import EmailData from '../../../models/email/data.js'

const isEmailArr = (obj: any, arr: EmailData[]): void => {
  expect(Array.isArray(obj)).to.equal(true)
  expect(obj.length).to.equal(arr.length)
  for (let i = 0; i < arr.length; i++) {
    expect(obj[i].addr).to.equal(arr[i].addr)
    expect(obj[i].verified).to.equal(arr[i].verified)
  }
}

export default isEmailArr
