import bcrypt from 'bcryptjs'
import cryptoRandomString from 'crypto-random-string'
import getValOrDefault from '../../utils/get-val-or-default.js'
const { genSaltSync, hashSync, compareSync } = bcrypt

class Password {
  hash: string = ''

  constructor (plaintext?: string) {
    this.change(getValOrDefault(plaintext, cryptoRandomString({ length: 64, type: 'distinguishable' })))
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
