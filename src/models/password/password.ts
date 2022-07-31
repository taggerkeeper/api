import bcrypt from 'bcryptjs'
import cryptoRandomString from 'crypto-random-string'
import getFirstVal from '../../utils/get-first-val.js'
const { genSaltSync, hashSync, compareSync } = bcrypt

class Password {
  hash: string = ''

  constructor (plaintext?: string) {
    this.change(getFirstVal(plaintext, cryptoRandomString({ length: 64, type: 'distinguishable' })))
  }

  change (plaintext: string): void {
    this.hash = Password.encrypt(plaintext)
  }

  verify (plaintext: string): boolean {
    return compareSync(plaintext, this.hash)
  }

  static encrypt (plaintext: string, saltRounds: number = 10): string {
    return hashSync(plaintext, genSaltSync(saltRounds))
  }
}

export default Password
