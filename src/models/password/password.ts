import bcrypt from 'bcryptjs'
import cryptoRandomString from 'crypto-random-string'
import getValOrDefault from '../../utils/get-val-or-default.js'
const { genSaltSync, hashSync } = bcrypt

class Password {
  hash: string = ''

  constructor (plaintext?: string) {
    this.change(getValOrDefault(plaintext, cryptoRandomString({ length: 64, type: 'distinguishable' })))
  }

  change (plaintext: string): void {
    this.hash = Password.encrypt(plaintext)
  }

  static encrypt (plaintext: string, saltRounds: number = 10): string {
    return hashSync(plaintext, genSaltSync(saltRounds))
  }
}

export default Password
