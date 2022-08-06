import { expect } from 'chai'
import getEnvVar, { envVarDefaults } from './get-env-var.js'

describe('getEnvVar', () => {
  it('returns undefined if the environment variable is not defined', () => {
    expect(getEnvVar('NOTHERE')).to.equal(undefined)
  })

  it('returns the environment variable if it doesn\'t have a default value', () => {
    process.env.TESTVAL = 'test'
    expect(getEnvVar('TESTVAL')).to.equal(process.env.TESTVAL)
    delete process.env.TESTVAL
  })

  it('returns correct types for each specified variable', () => {
    for (const name of Object.keys(envVarDefaults)) {
      expect(getEnvVar(name)).to.be.a(envVarDefaults[name].type)
    }
  })

  it('returns correct defaults for each specified variable', () => {
    for (const name of Object.keys(envVarDefaults)) {
      expect(getEnvVar(name)).to.equal(envVarDefaults[name].value)
    }
  })
})
