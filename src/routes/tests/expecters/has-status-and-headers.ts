import { expect } from 'chai'
import { Response } from 'superagent'

const hasStatusAndHeaders = (res: Response, status: number, headers: { [key: string]: string | RegExp }): void => {
  expect(res.status).to.equal(status)
  for (const header of Object.keys(headers)) {
    if (typeof headers[header] === 'string') {
      expect(res.headers[header]).to.equal(headers[header])
    } else {
      expect(res.headers[header]).to.match(headers[header] as RegExp)
    }
  }
}

export default hasStatusAndHeaders
