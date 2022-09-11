import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow.js'
import loadUserFromLogin from '../middlewares/load-user-from-login.js'
import generateTokens from '../middlewares/generate-tokens.js'
import requireBodyParts from '../middlewares/require-body-parts.js'
import requireRefreshToken from '../middlewares/require-refresh-token.js'
import requireUser from '../middlewares/require-user.js'
import saveUser from '../middlewares/save-user.js'

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
  post: (req: Request, res: Response) => {
    if (req.tokens === undefined) {
      res.status(500).send({ message: 'Tokens could not be generated.' })
    } else {
      const { access, refresh, refreshExpires, domain } = req.tokens
      res.cookie('refresh', refresh, { domain, httpOnly: true, maxAge: refreshExpires })
      res.status(200).send({ token: access })
    }
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

router.post('/', loadUserFromLogin, requireUser, generateTokens, collection.post)

// /tokens/:uid

const item = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  post: (req: Request, res: Response) => {
    if (req.tokens === undefined) {
      res.status(500).send({ message: 'Tokens could not be generated.' })
    } else {
      const { access, refresh, refreshExpires, domain } = req.tokens
      res.cookie('refresh', refresh, { domain, httpOnly: true, maxAge: refreshExpires })
      res.status(200).send({ token: access })
    }
  }
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
 *       400:
 *         description: "The refresh token was not included as the 'refresh' property in the body, or the refresh could not be verified."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error400"
 */

router.options('/:uid', requireBodyParts('refresh') as any, requireRefreshToken, item.options)

/**
 * @openapi
 * /tokens/{uid}:
 *   post:
 *     summary: "Exchange a refresh token for a new access token."
 *     description: "Exchange a refresh token for a new access token."
 *     tags:
 *       - "Tokens"
 *     requestBody:
 *       description: "The refresh token that the user would like to exchange."
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: "The refresh token that the user would like to exchange."
 *             properties:
 *               $ref: "#/components/schemas/RefreshToken"
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             description: "The refresh token that the user would like to exchange."
 *             properties:
 *               $ref: "#/components/schemas/RefreshToken"
 *     responses:
 *       200:
 *         description: "The user is being issued a new access token and a new refresh token."
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               $ref: "#/components/schemas/RefreshToken"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AccessToken"
 *       400:
 *         description: "The refresh token was not included as the 'refresh' property in the post body."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error400"
 *       401:
 *         description: "The refresh token could not be verified."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error401"
 */

router.post('/:uid', requireBodyParts('refresh') as any, requireRefreshToken, generateTokens, saveUser, item.post)

export default router
