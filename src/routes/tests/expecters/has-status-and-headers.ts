import { expect } from 'chai'
import { Response } from 'superagent'

const hasStatusAndHeaders = (res: Response, status: number, headers: { [key: string]: string }): void => {
  expect(res.status).to.equal(status)
  for (const header of Object.keys(headers)) {
    expect(res.headers[header]).to.equal(headers[header])
  }
}

export default hasStatusAndHeaders
