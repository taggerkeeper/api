import { expect } from 'chai'
import User from '../../user/user.js'
import getSubqueries from './index.js'

describe('getSubqueries', () => {
  const id = '0123456789abcdef12345678'
  const admin = new User({ name: 'Admin', admin: true })
  const user = new User({ name: 'Searcher', id })

  it('returns an empty array for an admin', () => {
    const actual = getSubqueries(admin)
    expect(Array.isArray(actual)).to.equal(true)
    expect(actual).to.have.lengthOf(0)
  })

  it('returns untrashed and anonymous check for an anonymous user', () => {
    const actual = getSubqueries()
    expect(Array.isArray(actual)).to.equal(true)
    expect(actual).to.have.lengthOf(2)
    expect(JSON.stringify(actual[0])).to.equal('{"revisions.0.permissions.read":"anyone"}')
    expect(JSON.stringify(actual[1])).to.equal('{"trashed":{"$exists":false}}')
  })

  it('returns untrashed and authenticated/editor check for an authenticated user', () => {
    const actual = getSubqueries(user)
    const anyoneJson = '{"revisions.0.permissions.read":"anyone"}'
    const authenticatedJson = '{"revisions.0.permissions.read":"authenticated"}'
    const editorLevelJson = '{"revisions.0.permissions.read":"editor"}'
    const isEditorJson = `{"revisions.editor":"${id}"}`
    const permissionsJson = `{"$or":[${anyoneJson},${authenticatedJson},{"$and":[${editorLevelJson},${isEditorJson}]}]}`
    expect(Array.isArray(actual)).to.equal(true)
    expect(actual).to.have.lengthOf(2)
    expect(JSON.stringify(actual[0])).to.equal(permissionsJson)
    expect(JSON.stringify(actual[1])).to.equal('{"trashed":{"$exists":false}}')
  })
})
