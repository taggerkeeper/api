import { Request, Response, Router } from 'express'
import expressAsyncHandler from 'express-async-handler'
import Page from '../models/page/page.js'

import allow from '../middlewares/allow.js'
import loadUserFromAccessToken from '../middlewares/load-user-from-access-token.js'

const router = Router()

const renderer = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(200)
  },
  get: expressAsyncHandler(async (req: Request, res: Response) => {
    const render = await Page.render(req.query.text?.toString() ?? '')
    res.status(200).send(render)
  })
}

router.all('/', allow(renderer))

/**
 * @openapi
 * /renderer:
 *   options:
 *     summary: "Methods for the renderer endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - renderer
 *     security:
 *       - bearerAuth: []
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

router.options('/', loadUserFromAccessToken, renderer.options)

/**
 * @openapi
 * /renderer:
 *   head:
 *     summary: "Return headers for rendering text."
 *     description: "Returns the headers that a user would receive if rendering text."
 *     tags:
 *       - renderer
 *     parameters:
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *         description: "The text to be rendered."
 *         example: "Some text is **bolded**, and some is in _italics_."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
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

router.head('/', loadUserFromAccessToken, renderer.head)

/**
 * @openapi
 * /renderer:
 *   get:
 *     summary: "Render text."
 *     description: "This method renders a string of text as it would be rendered as the content of a page."
 *     tags:
 *       - renderer
 *     parameters:
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *         description: "The text to be rendered."
 *         example: "Some text is **bolded**, and some is in _italics_."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
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
 *           plain/text:
 *             schema:
 *               type: string
 *               example: "<p>Some text is <strong>bolded</strong>, and some is in <em>italics</em>.</p>"
 *
 */

router.get('/', loadUserFromAccessToken, renderer.get)

export default router
