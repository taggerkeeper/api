import { expect } from 'chai'
import stripUndefinedAddedRemoved from './strip-undefined-added-removed.js'

describe('stripUndefinedAddedRemoved', () => {
  it('strips undefined added and removed from RevisionsDiff', () => {
    const diff = {
      content: {
        title: [
          { added: undefined, removed: true, value: 'Test' },
          { added: true, removed: undefined, value: 'Test' }
        ],
        path: [],
        body: []
      },
      file: { before: null, after: null },
      thumbnail: { before: null, after: null },
      permissions: {
        read: [],
        write: []
      }
    }

    const actual = stripUndefinedAddedRemoved(diff)
    expect(Object.keys(actual.content.title[0]).join(' ')).to.equal('removed value')
    expect(Object.keys(actual.content.title[1]).join(' ')).to.equal('added value')
  })
})
