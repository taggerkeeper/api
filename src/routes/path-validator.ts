import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow.js'

const router = Router()

const pathValidator = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  }
}

router.all('/', allow(pathValidator))

/**
 * @openapi
 * /path-validator:
 *   options:
 *     summary: "Methods for the path validator endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - renderer
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

router.options('/', pathValidator.options)

export default router
