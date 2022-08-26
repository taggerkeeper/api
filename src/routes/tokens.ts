import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow.js'

const router = Router()

/**
 * @openapi
 * components:
 *   schemas:
 *     AuthenticationInput:
 *       type: object
 *       description: The information that the user must provide to authenticate.
 *       properties:
 *         addr:
 *           type: string
 *           description: "The user's email address. Any of your verified email addresses will work for this."
 *           example: "tester@testing.com"
 *         password:
 *           type: string
 *           description: "Your password. This is submitted in plaintext and compared to the stored hash."
 *           example: "Longer passwords are better passwords."
 *         passcode:
 *           type: string
 *           description: "If you have enabled two-factor authentication, you must also supply a passcode."
 *           example: "123456"
 *     AccessToken:
 *       type: object
 *       description: The access token provided to an authenticated user.
 *       properties:
 *         token:
 *           type: string
 *           description: "A JSON web token used to gain access to parts of the API that require authentication."
 *     RefreshToken:
 *       type: string
 *       description: A JSON web token that can be exchanged for a new access token.
 */

// /tokens

const collection = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  }
}

router.all('/', allow(collection))

/**
 * @openapi
 * /tokens:
 *   options:
 *     summary: "Return options on how to use the Tokens collection."
 *     description: "Return which options are permissible for the Tokens collection."
 *     tags:
 *       - "Tokens"
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               description: "The methods allowed for the tokens endpoint."
 *               example: "OPTIONS, POST"
 */

router.options('/', collection.options)

export default router
