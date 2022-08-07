import { expect } from 'chai'
import User from '../../user/user.js'
import getSecuritySubquery from './get-security-subquery.js'

describe('getSecuritySubquery', () => {
  const anyoneJson = '{"revisions.0.permissions.read":"anyone"}'

  it('just checks for pages that can be anonymously read if not given a user', () => {
    expect(JSON.stringify(getSecuritySubquery())).to.equal(anyoneJson)
  })

  it('just checks for pages that can be anonymously read if given undefined', () => {
    expect(JSON.stringify(getSecuritySubquery(undefined))).to.equal(anyoneJson)
  })

  it('returns an empty object if the user is an admin', () => {
    const admin = new User({ name: 'Admin', admin: true })
    expect(JSON.stringify(getSecuritySubquery(admin))).to.equal('{}')
  })

  it('returns permissions logic for other users', () => {
    const id = '0123456789abcdef12345678'
    const searcher = new User({ id, name: 'Searcher' })
    const authenticatedJson = '{"revisions.0.permissions.read":"authenticated"}'
    const editorLevelJson = '{"revisions.0.permissions.read":"editor"}'
    const isEditorJson = `{"revisions.editor":"${id}"}`
    const json = `{"$or":[${anyoneJson},${authenticatedJson},{"$and":[${editorLevelJson},${isEditorJson}]}]}`
    expect(JSON.stringify(getSecuritySubquery(searcher))).to.equal(json)
  })
})
