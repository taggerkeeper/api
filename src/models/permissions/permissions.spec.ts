import { expect } from 'chai'
import Content from '../content/content.js'
import Revision from '../revision/revision.js'
import User from '../user/user.js'
import Permissions, { PermissionLevel } from './permissions.js'

describe('Permissions', () => {
  describe('constructor', () => {
    it('defaults to anyone for read permissions', () => {
      const actual = new Permissions()
      expect(actual.read).to.equal('anyone')
    })

    it('defaults to read permissions set by environment variable', () => {
      process.env.DEFAULT_READ_PERMISSIONS = 'authenticated'
      const actual = new Permissions()
      delete process.env.DEFAULT_READ_PERMISSIONS
      expect(actual.read).to.equal('authenticated')
    })

    it('sets read permissions', () => {
      const actual = new Permissions(PermissionLevel.editor)
      expect(actual.read).to.equal('editor')
    })

    it('defaults to anyone write permissions', () => {
      const actual = new Permissions()
      expect(actual.write).to.equal('anyone')
    })

    it('defaults to write permissions set by environment variable', () => {
      process.env.DEFAULT_WRITE_PERMISSIONS = 'authenticated'
      const actual = new Permissions()
      delete process.env.DEFAULT_WRITE_PERMISSIONS
      expect(actual.write).to.equal('authenticated')
    })

    it('sets write permissions', () => {
      const actual = new Permissions(PermissionLevel.editor, PermissionLevel.editor)
      expect(actual.write).to.equal('editor')
    })
  })

  describe('Instance methods', () => {
    const user = new User()
    const editor = new User()
    editor.id = '0123456789abcdef12345678'
    const admin = new User({ admin: true })
    const r1 = new Revision({ content: new Content('Title', 'Body text goes here.'), editor, msg: 'First revision.' })
    const r2 = new Revision({ content: new Content('New Title', 'Updated body test.'), editor, msg: 'Second revision.' })
    const revisions = [r2, r1]

    describe('check', () => {
      it('returns true for an anonymous user if anyone can read', () => {
        const perms = new Permissions()
        expect(perms.check('read', undefined, revisions)).to.equal(true)
      })

      it('returns false for an anonymous user if only authenticated users can read', () => {
        const perms = new Permissions(PermissionLevel.authenticated)
        expect(perms.check('read', undefined, revisions)).to.equal(false)
      })

      it('returns false for an anonymous user if only editors can read', () => {
        const perms = new Permissions(PermissionLevel.editor)
        expect(perms.check('read', undefined, revisions)).to.equal(false)
      })

      it('returns false for an anonymous user if only admins can read', () => {
        const perms = new Permissions(PermissionLevel.admin)
        expect(perms.check('read', undefined, revisions)).to.equal(false)
      })

      it('returns true for an authenticated user if anyone can read', () => {
        const perms = new Permissions()
        expect(perms.check('read', user, revisions)).to.equal(true)
      })

      it('returns true for an authenticated user if only authenticated users can read', () => {
        const perms = new Permissions(PermissionLevel.authenticated)
        expect(perms.check('read', user, revisions)).to.equal(true)
      })

      it('returns false for an authenticated user if only editors can read', () => {
        const perms = new Permissions(PermissionLevel.editor)
        expect(perms.check('read', user, revisions)).to.equal(false)
      })

      it('returns false for an authenticated user if only admins can read', () => {
        const perms = new Permissions(PermissionLevel.admin)
        expect(perms.check('read', user, revisions)).to.equal(false)
      })

      it('returns true for an editor if anyone can read', () => {
        const perms = new Permissions()
        expect(perms.check('read', editor, revisions)).to.equal(true)
      })

      it('returns true for an editor if only authenticated users can read', () => {
        const perms = new Permissions(PermissionLevel.authenticated)
        expect(perms.check('read', editor, revisions)).to.equal(true)
      })

      it('returns true for an editor if only editors can read', () => {
        const perms = new Permissions(PermissionLevel.editor)
        expect(perms.check('read', editor, revisions)).to.equal(true)
      })

      it('returns false for an editor if only admins can read', () => {
        const perms = new Permissions(PermissionLevel.admin)
        expect(perms.check('read', editor, revisions)).to.equal(false)
      })

      it('returns true for an admin if anyone can read', () => {
        const perms = new Permissions()
        expect(perms.check('read', admin, revisions)).to.equal(true)
      })

      it('returns true for an admin if only authenticated users can read', () => {
        const perms = new Permissions(PermissionLevel.authenticated)
        expect(perms.check('read', admin, revisions)).to.equal(true)
      })

      it('returns true for an admin if only editors can read', () => {
        const perms = new Permissions(PermissionLevel.editor)
        expect(perms.check('read', admin, revisions)).to.equal(true)
      })

      it('returns true for an admin if only admins can read', () => {
        const perms = new Permissions(PermissionLevel.admin)
        expect(perms.check('read', admin, revisions)).to.equal(true)
      })

      it('returns true for an anonymous user if anyone can write', () => {
        const perms = new Permissions()
        expect(perms.check('write', undefined, revisions)).to.equal(true)
      })

      it('returns false for an anonymous user if only authenticated users can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.authenticated
        expect(perms.check('write', undefined, revisions)).to.equal(false)
      })

      it('returns false for an anonymous user if only editors can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.editor
        expect(perms.check('write', undefined, revisions)).to.equal(false)
      })

      it('returns false for an anonymous user if only admins can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.admin
        expect(perms.check('write', undefined, revisions)).to.equal(false)
      })

      it('returns true for an authenticated user if anyone can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.anyone
        expect(perms.check('write', user, revisions)).to.equal(true)
      })

      it('returns true for an authenticated user if only authenticated users can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.authenticated
        expect(perms.check('write', user, revisions)).to.equal(true)
      })

      it('returns false for an authenticated user if only editors can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.editor
        expect(perms.check('write', user, revisions)).to.equal(false)
      })

      it('returns false for an authenticated user if only admins can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.admin
        expect(perms.check('write', user, revisions)).to.equal(false)
      })

      it('returns true for an editor if anyone can write', () => {
        const perms = new Permissions()
        expect(perms.check('write', editor, revisions)).to.equal(true)
      })

      it('returns true for an editor if only authenticated users can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.authenticated
        expect(perms.check('write', editor, revisions)).to.equal(true)
      })

      it('returns true for an editor if only editors can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.editor
        expect(perms.check('write', editor, revisions)).to.equal(true)
      })

      it('returns false for an editor if only admins can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.admin
        expect(perms.check('write', editor, revisions)).to.equal(false)
      })

      it('returns true for an admin if anyone can write', () => {
        const perms = new Permissions()
        expect(perms.check('write', admin, revisions)).to.equal(true)
      })

      it('returns true for an admin if only authenticated users can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.authenticated
        expect(perms.check('write', admin, revisions)).to.equal(true)
      })

      it('returns true for an admin if only editors can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.editor
        expect(perms.check('write', admin, revisions)).to.equal(true)
      })

      it('returns true for an admin if only admins can write', () => {
        const perms = new Permissions()
        perms.write = PermissionLevel.admin
        expect(perms.check('write', admin, revisions)).to.equal(true)
      })
    })
  })
})
