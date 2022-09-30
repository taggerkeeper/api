import { Request, Response, Router } from 'express'
import expressAsyncHandler from 'express-async-handler'
import OTP from '../models/otp/otp.js'

import allow from '../middlewares/allow.js'
import loadUserFromAccessToken from '../middlewares/load-user-from-access-token.js'
import requireUser from '../middlewares/require-user.js'

const router = Router()

const otp = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    const status = req.user === undefined ? 500 : 204
    res.sendStatus(status)
  },
  get: expressAsyncHandler(async (req: Request, res: Response) => {
    const secret = await OTP.generate()
    if (req.user !== undefined) {
      req.user.otp.secret = secret.base32
      await req.user.save()
      res.status(200).send(secret.qr)
    } else {
      res.status(500).json({ message: 'No user found.' })
    }
  }),
  post: expressAsyncHandler(async (req: Request, res: Response) => {
    if (req.user?.otp.secret !== undefined) {
      const { secret } = req.user.otp
      const verified = OTP.verify(secret, req.body.code)
      if (verified) {
        req.user.otp.enable(secret)
        await req.user.save()
        res.status(200).send({ message: 'OTP verified and enabled.', id: req.user.id })
      } else {
        res.status(400).send({ message: 'Could not verify code provided.' })
      }
    } else if (req.user === undefined) {
      res.status(401).send({ message: 'This method requires authentication.' })
    } else {
      res.status(400).send({ message: 'No code provided.' })
    }
  }),
  delete: expressAsyncHandler(async (req: Request, res: Response) => {
    if (req.user !== undefined) {
      req.user.otp.enabled = false
      delete req.user.otp.secret
      await req.user.save()
      res.status(200).send({ message: 'OTP disabled.', id: req.user.id })
    } else {
      res.status(401).send({ message: 'This method requires authentication.' })
    }
  })
}

router.all('/', allow(otp))

/**
 * @openapi
 * /otp:
 *   options:
 *     summary: "Methods for the OTP endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - otp
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "This typically happens when you make a request without an authorization header."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This method requires authentication."
 *       401:
 *         description: "This typically happens when you call a request with an authorization header that does not include a verifiable access token."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
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
 *                   example: "This method requires authentication."
 *       403:
 *         description: "This typically happen when you make a request with a deactivated user account."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "Your account has been deactivated."
 */

router.options('/', loadUserFromAccessToken, requireUser, otp.options)

/**
 * @openapi
 * /otp:
 *   head:
 *     summary: "Returns the headers for the OTP endpoint."
 *     description: "Returns the headers that a user would receive if requesting the OTP endpoint."
 *     tags:
 *       - otp
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "This typically happens when you make a request without an authorization header."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This method requires authentication."
 *       401:
 *         description: "This typically happens when you call a request with an authorization header that does not include a verifiable access token."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
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
 *                   example: "This method requires authentication."
 *       403:
 *         description: "This typically happen when you make a request with a deactivated user account."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "Your account has been deactivated."
 *       500:
 *         description: "The server encountered an unexpected error."
 */

router.head('/', loadUserFromAccessToken, requireUser, otp.head)

/**
 * @openapi
 * /otp:
 *   get:
 *     summary: "Get a one-time-password secret."
 *     description: "Generates a new one-time-password secret and returns a QR code for the user to save and verify. The one-time-password will not be enabled on the account until the user has verified receipt of the secret using the `POST /otp` method."
 *     tags:
 *       - otp
 *     responses:
 *       200:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               description: "A QR code that the user can use to save the one-time-password secret."
 *       400:
 *         description: "This typically happens when you make a request without an authorization header."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This method requires authentication."
 *       401:
 *         description: "This typically happens when you call a request with an authorization header that does not include a verifiable access token."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
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
 *                   example: "This method requires authentication."
 *       403:
 *         description: "This typically happen when you make a request with a deactivated user account."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "Your account has been deactivated."
 *       500:
 *         description: "The server encountered an unexpected error."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found."
 */

router.get('/', loadUserFromAccessToken, requireUser, otp.get)

/**
 * @openapi
 * /otp:
 *   post:
 *     summary: "Enable OTP."
 *     description: "If the code provided can be verified, enables OTP with the secret generated with the most recent `GET /otp` request."
 *     tags:
 *       - otp
 *     requestBody:
 *       description: "The code to verify."
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: "A valid passcode from the secret generated by callined the `GET /otp` method."
 *                 example: "123456"
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: "A valid passcode from the secret generated by callined the `GET /otp` method."
 *                 example: "123456"
 *     responses:
 *       200:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of what has happened."
 *                   example: "OTP verified and enabled."
 *                 id:
 *                   type: string
 *                   description: "The user's unique 24-digit hexadecimal ID number."
 *                   example: "0123456789abcdef12345678"
 *       400:
 *         description: "This typically happens when you make a request without an authorization header or without supplying a code to verify."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This method requires authentication."
 *       401:
 *         description: "This typically happens when you call a request with an authorization header that does not include a verifiable access token."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
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
 *                   example: "This method requires authentication."
 *       403:
 *         description: "This typically happen when you make a request with a deactivated user account."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "Your account has been deactivated."
 *       500:
 *         description: "The server encountered an unexpected error."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found."
 */

router.post('/', loadUserFromAccessToken, requireUser, otp.post)

/**
 * @openapi
 * /otp:
 *   delete:
 *     summary: "Disable OTP."
 *     description: "Disable OTP."
 *     tags:
 *       - otp
 *     responses:
 *       200:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of what has happened."
 *                   example: "OTP disabled."
 *                 id:
 *                   type: string
 *                   description: "The user's unique 24-digit hexadecimal ID number."
 *                   example: "0123456789abcdef12345678"
 *       400:
 *         description: "This typically happens when you make a request without an authorization header."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This method requires authentication."
 *       401:
 *         description: "This typically happens when you call a request with an authorization header that does not include a verifiable access token."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
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
 *                   example: "This method requires authentication."
 *       403:
 *         description: "This typically happen when you make a request with a deactivated user account."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "Your account has been deactivated."
 *       500:
 *         description: "The server encountered an unexpected error."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found."
 */

router.delete('/', loadUserFromAccessToken, requireUser, otp.delete)

export default router
