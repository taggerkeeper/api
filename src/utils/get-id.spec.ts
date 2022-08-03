import { expect } from 'chai'
import * as sinon from 'sinon'
import mongoose from 'mongoose'
import getId from './get-id.js'

describe('getId', () => {
  it('returns null if not given an argument', () => {
    expect(getId()).to.equal(null)
  })

  it('returns null if passed undefined', () => {
    expect(getId(undefined)).to.equal(null)
  })

  it('returns null if passed null', () => {
    expect(getId(null)).to.equal(null)
  })

  it('returns null if passed a string', () => {
    expect(getId('12345')).to.equal(null)
  })

  it('returns null if passed a number', () => {
    expect(getId(12345)).to.equal(null)
  })

  it('returns null if passed an array', () => {
    expect(getId([])).to.equal(null)
  })

  it('returns the stringified version of a Mongoose ID', () => {
    sinon.stub(mongoose, 'isValidObjectId').returns(true)
    const str = 'test'
    const _id = { toString: () => str }
    expect(getId({ _id })).to.equal(str)
    sinon.restore()
  })

  it('returns _id if it is a string', () => {
    const _id = 'test'
    expect(getId({ _id })).to.equal(_id)
  })

  it('returns id if it is a string', () => {
    const id = 'test'
    expect(getId({ id })).to.equal(id)
  })

  it('returns null if there is no _id or id', () => {
    expect(getId({})).to.equal(null)
  })

  it('returns null if _id is a number', () => {
    sinon.stub(mongoose, 'isValidObjectId').returns(false)
    expect(getId({ _id: 12345 })).to.equal(null)
    sinon.restore()
  })

  it('returns null if _id is true', () => {
    expect(getId({ _id: true })).to.equal(null)
  })

  it('returns null if _id is false', () => {
    expect(getId({ _id: false })).to.equal(null)
  })

  it('returns null if _id is an object other than a Mongoose ID', () => {
    expect(getId({ _id: {} })).to.equal(null)
  })

  it('returns null if _id is an array', () => {
    expect(getId({ _id: [] })).to.equal(null)
  })

  it('returns null if id is a number', () => {
    expect(getId({ id: 12345 })).to.equal(null)
  })

  it('returns null if id is true', () => {
    expect(getId({ id: true })).to.equal(null)
  })

  it('returns null if id is false', () => {
    expect(getId({ id: false })).to.equal(null)
  })

  it('returns null if id is an object', () => {
    expect(getId({ id: {} })).to.equal(null)
  })

  it('returns null if id is an array', () => {
    expect(getId({ id: [] })).to.equal(null)
  })
})
