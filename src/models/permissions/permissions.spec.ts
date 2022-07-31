import { expect } from 'chai'
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
      expect(actual.write).to.equal('authenticated')
    })

    it('sets write permissions', () => {
      const actual = new Permissions(PermissionLevel.editor, PermissionLevel.editor)
      expect(actual.write).to.equal('editor')
    })
  })
})