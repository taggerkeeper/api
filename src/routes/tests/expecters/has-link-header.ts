import { expect } from 'chai'
import { Response } from 'superagent'

const parseLinks = (header: string): any => {
  const links: any = {}
  const coll = header.split(',').map(link => link.trim())
  coll.forEach(link => {
    const match = link.match(/<(.*?)>; rel="(.*?)"/i)
    if (match !== null && match.length > 2) {
      links[match[2]] = match[1]
    }
  })
  return links
}

const hasLinkHeader = (res: Response, links: string[]): void => {
  const rels = Object.keys(parseLinks(res.headers.link))
  expect(res.headers.link).not.to.equal(undefined)
  expect(rels).to.have.lengthOf(links.length)
  for (const link of links) {
    expect(rels).to.include(link)
  }
}

export default hasLinkHeader
