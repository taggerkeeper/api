import { expect } from 'chai'
import Permissions from './permissions.js'

describe('Permissions', () => {
  describe('constructor', () => {
    it('defaults to 777 read permissions', () => {
      const actual = new Permissions()
      expect(actual.read).to.equal('777')
    })

    it('defaults to read permissions set by environment variable', () => {
      process.env.DEFAULT_READ_PERMISSIONS = '770'
      const actual = new Permissions()
      expect(actual.read).to.equal('770')
    })

    it('sets read permissions', () => {
      const actual = new Permissions('700')
      expect(actual.read).to.equal('700')
    })

    it('defaults to 777 write permissions', () => {
      const actual = new Permissions()
      expect(actual.write).to.equal('777')
    })

    it('defaults to write permissions set by environment variable', () => {
      process.env.DEFAULT_WRITE_PERMISSIONS = '770'
      const actual = new Permissions()
      expect(actual.write).to.equal('770')
    })

    it('sets write permissions', () => {
      const actual = new Permissions('700', '600')
      expect(actual.write).to.equal('600')
    })
  })
})