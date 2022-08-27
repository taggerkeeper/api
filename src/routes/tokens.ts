import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow.js'
import loadUserFromLogin from '../middlewares/load-user-from-login.js'
import issueTokens from '../middlewares/issue-tokens.js'
import requireBodyParts from '../middlewares/require-body-parts.js'
import requireRefreshToken from '../middlewares/require-refresh-token.js'
import requireUser from '../middlewares/require-user.js'

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
  },
  post: issueTokens
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

/**
 * @openapi
 * /tokens:
 *   post:
 *     summary: "Authenticate a user."
 *     description: "Authenticare a user."
 *     tags:
 *       - "Tokens"
 *     requestBody:
 *       description: "The information that the user must provide to authenticate."
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AuthenticationInput"
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: "#/components/schemas/AuthenticationInput"
 *     responses:
 *       200:
 *         description: "THe user was authenticated."
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               $ref: "#/components/schemas/RefreshToken"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AccessToken"
 *       401:
 *         description: "Authentication failed."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: "Authentication failed."
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error."
 *                   example: "You are not authoried."
 */

router.post('/', loadUserFromLogin, requireUser, collection.post)

// /tokens/:uid

const item = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  post: issueTokens
}

router.all('/:uid', allow(item))

/**
 * @openapi
 * /tokens/{uid}:
 *   options:
 *     summary: "Return options on how to use an individual Token resource."
 *     description: "Return which options are permissible for an individual Token resource."
 *     tags:
 *       - "Tokens"
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               description: "The methods allowed for the individual token endpoint."
 *               example: "OPTIONS, POST"
 */

router.options('/:uid', requireBodyParts('refresh') as any, requireRefreshToken, item.options)

export default router
