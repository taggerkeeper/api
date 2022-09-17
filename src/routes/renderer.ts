import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow.js'
import loadUserFromAccessToken from '../middlewares/load-user-from-access-token.js'

const router = Router()

const renderer = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  }
}

router.all('/', allow(renderer))

/**
 * @openapi
 * /renderer:
 *   options:
 *     summary: "Methods for the renderer endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - otp
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS"
 *             description: "The methods that this endpoint allows."
 */

router.options('/', loadUserFromAccessToken, renderer.options)

export default router
