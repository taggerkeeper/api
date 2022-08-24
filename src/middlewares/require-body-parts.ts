import { Request, Response, NextFunction } from 'express'
import andStr from '../utils/and-str.js'

const requireBodyParts = (...parts: string[]): Function => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { body } = req
    const notIncluded = body === undefined ? parts : parts.filter(part => body[part] === undefined)
    const message = `This method requires a body with elements ${andStr(notIncluded.map(part => `'${part}'`))}`
    if (notIncluded.length > 0) {
      res.status(400).send({ message })
    } else {
      next()
    }
  }
}

export default requireBodyParts
