class Password {
  hash: string = ''

  constructor (plaintext?: string) {
    this.hash = plaintext === undefined ? '' : plaintext
  }
}

export default Password
