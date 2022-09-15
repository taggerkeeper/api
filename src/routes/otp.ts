import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow.js'
import loadUserFromAccessToken from '../middlewares/load-user-from-access-token.js'
import requireUser from '../middlewares/require-user.js'

const router = Router()

const otp = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  }
}

router.all('/', allow(otp))

/**
 * @openapi
 * /otp:
 *   options:
 *     summary: "Methods for the OTP collection."
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
 *       400:
 *         description: "This typically happens when you make a request without an authorization header."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example "This method requires authentication."
 *       401:
 *         description: "This typically happens when you call a request with an authorization header that does not include a verifiable access token."
 *         headers:
 *           'WWW-Authenticate':
 *             schema:
 *               type: string
 *               example: 'Bearer error="invalid_token" error_description="The access token could not be verified."'
 *             description: "A description of what you need to authenticate. See `POST /tokens` for the method necessary to obtain an access token. This token should be passed to the method in a Bearer Authorization header."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example "This method requires authentication."
 *       403:
 *         description: "This typically happen when you make a request with a deactivated user account."
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

export default router
