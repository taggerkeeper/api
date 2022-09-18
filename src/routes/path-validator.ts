import { Request, Response, Router } from 'express'
import expressAsyncHandler from 'express-async-handler'
import validatePath from '../utils/validate-path.js'

import allow from '../middlewares/allow.js'

const router = Router()

const validate = async (req: Request): Promise<{ status: number, message: string, path: string }> => {
  const path = req.query.path as string ?? ''
  const validation = await validatePath(path)
  const status = validation.isValid ? 200 : 400
  const message = validation.isValid ? `The path ${path} is valid.` : validation.reason ?? ''
  return { status, message, path }
}

const pathValidator = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: expressAsyncHandler(async (req: Request, res: Response) => {
    const { status } = await validate(req)
    res.sendStatus(status)
  }),
  get: expressAsyncHandler(async (req: Request, res: Response) => {
    const { status, message, path } = await validate(req)
    res.status(status).send({ message, path })
  })
}

router.all('/', allow(pathValidator))

/**
 * @openapi
 * /path-validator:
 *   options:
 *     summary: "Methods for the path validator endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - path validation
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 */

router.options('/', pathValidator.options)

/**
 * @openapi
 * /path-validator:
 *   head:
 *     summary: "Return headers for path validation."
 *     description: "Returns the headers that a user would receive if trying to validate a path."
 *     tags:
 *       - path validation
 *     parameters:
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *         description: "The path to be validated."
 *         example: "/path/to/validate"
 *     responses:
 *       200:
 *         description: "The path is valid."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "The path is not valid."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 */

router.head('/', pathValidator.head)

/**
 * @openapi
 * /path-validator:
 *   get:
 *     summary: "Validate a path."
 *     description: "Validate a path."
 *     tags:
 *       - path validation
 *     parameters:
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *         description: "The path to be validated."
 *         example: "/path/to/validate"
 *     responses:
 *       200:
 *         description: "The path is valid."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the outcome of the validation."
 *                   example: "The path /path/to/validate is valid."
 *                 path:
 *                   type: string
 *                   description: "The path that was validated."
 *                   example: "/path/to/validate"
 *       400:
 *         description: "The path is not valid."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the outcome of the validation."
 *                   example: "The path /path/to/validate is valid."
 *                 path:
 *                   type: string
 *                   description: "The path /path/to/validate is already in use."
 *                   example: "/path/to/validate"
 */

router.get('/', pathValidator.get)

export default router
