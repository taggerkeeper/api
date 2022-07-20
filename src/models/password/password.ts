import bcrypt from 'bcryptjs'
const { genSaltSync, hashSync } = bcrypt

class Password {
  hash: string = ''

  constructor (plaintext?: string) {
    this.hash = plaintext === undefined ? '' : plaintext
  }

  change (plaintext: string): void {
    this.hash = Password.encrypt(plaintext)
  }

  static encrypt (plaintext: string, saltRounds: number = 10): string {
    return hashSync(plaintext, genSaltSync(saltRounds))
  }
}

export default Password
