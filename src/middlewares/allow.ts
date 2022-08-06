import { Request, Response, NextFunction } from 'express'
import stripQueryStr from '../utils/strip-query-str.js'

const allow = (resource: { [key: string]: Function }) => (req: Request, res: Response, next: NextFunction) => {
  const methods = Object.keys(resource).map(key => key.toUpperCase())
  const { method } = req
  const path = stripQueryStr(req.originalUrl)

  res.set('Allow', methods.join(', '))
  res.set('Access-Control-Allow-Methods', methods.join(', '))
  if (methods.includes(method)) {
    next()
  } else {
    res.status(405).send({ status: 405, message: `${method} is not a method allowed for ${path}` })
  }
}

export default allow
