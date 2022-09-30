import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow.js'
import loadUserFromLogin from '../middlewares/load-user-from-login.js'
import generateTokens from '../middlewares/generate-tokens.js'
import requireBodyParts from '../middlewares/require-body-parts.js'
import requireRefreshToken from '../middlewares/require-refresh-token.js'
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
 *     summary: "Methods for the Tokens collection."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - tokens
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 */

router.options('/', collection.options)

/**
 * @openapi
 * /tokens:
 *   post:
 *     summary: "Authenticate a user."
 *     description: "This method takes a username and password (and a passcode, if you have enabled one-time passwords) and returns an access token and a refresh token if you can be authenticated with those credentials."
 *     tags:
 *       - tokens
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
 *         description: "The user was authenticated."
 *         headers:
 *           'Set-Cookie':
 *             schema:
 *               type: string
 *             description: "A JSON web token (JWT) which you can submit to the `/tokens/{uid}` endpoint to acquire a new access token and a new refresh token."
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             description: "A JSON web token (JWT) which can be submitted as a Bearer token to authorize access to secured parts of the API."
 *       400:
 *         description: "Authentication failed."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "Authentication failed."
 *       500:
 *         description: "An unexpected error occurred."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "An unexpected error occurred."
 */

router.post('/', loadUserFromLogin, generateTokens, collection.post)

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
 *     summary: "Methods for a Tokens item."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - tokens
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "The refresh token was not included as the 'refresh' property in the body."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This method requires a body with elements 'refresh'"
 *       401:
 *         description: "The refresh token provided could not be verified."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'WWW-Authenticate':
 *             schema:
 *               type: string
 *               example: "Bearer error=\"invalid_token\" error_description=\"The access token could not be verified.\""
 *             description: "A description of what you need to authenticate. See `POST /tokens` for the method necessary to obtain an access token. This token should be passed to the method in a Bearer Authorization header."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "Could not verify refresh token."
 */

router.options('/:uid', requireBodyParts('refresh') as any, requireRefreshToken, item.options)

/**
 * @openapi
 * /tokens/{uid}:
 *   post:
 *     summary: "Exchange a refresh token for a new access token."
 *     description: "Exchange a refresh token for a new access token."
 *     tags:
 *       - tokens
 *     requestBody:
 *       description: "The refresh token that the user would like to exchange."
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: "The refresh token that the user would like to exchange."
 *             properties:
 *               refresh:
 *                 type: string
 *                 description: "Your refresh token. This is the JSON web token (JWT) which you received as a cookie when you authenticated, or when you last used this method."
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             description: "The refresh token that the user would like to exchange."
 *             properties:
 *               refresh:
 *                 type: string
 *                 description: "Your refresh token. This is the JSON web token (JWT) which you received as a cookie when you authenticated, or when you last used this method."
 *     responses:
 *       200:
 *         description: "The user is being issued a new access token and a new refresh token."
 *         headers:
 *           'Set-Cookie':
 *             schema:
 *               type: string
 *             description: "A JSON web token (JWT) which you can submit to the `/tokens/{uid}` endpoint to acquire a new access token and a new refresh token."
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             description: "A JSON web token (JWT) which can be submitted as a Bearer token to authorize access to secured parts of the API."
 *       400:
 *         description: "The refresh token was not included as the 'refresh' property in the body."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This method requires a body with elements 'refresh'"
 *       401:
 *         description: "The refresh token provided could not be verified."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, POST"
 *             description: "The methods that this endpoint allows."
 *           'WWW-Authenticate':
 *             schema:
 *               type: string
 *               example: "Bearer error=\"invalid_token\" error_description=\"The access token could not be verified.\""
 *             description: "A description of what you need to authenticate. See `POST /tokens` for the method necessary to obtain an access token. This token should be passed to the method in a Bearer Authorization header."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "Could not verify refresh token."
 */

router.post('/:uid', requireBodyParts('refresh') as any, requireRefreshToken, generateTokens, saveUser, item.post)

export default router
