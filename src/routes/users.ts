import { Request, Response, Router } from 'express'

import loadPackage from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'

import activate from '../middlewares/activate.js'
import addEmail from '../middlewares/add-email.js'
import allow from '../middlewares/allow.js'
import createUser from '../middlewares/create-user.js'
import deactivate from '../middlewares/deactivate.js'
import demote from '../middlewares/demote.js'
import dropEmail from '../middlewares/drop-email.js'
import getEmail from '../middlewares/get-email.js'
import loadSubject from '../middlewares/load-subject.js'
import loadUserFromAccessToken from '../middlewares/load-user-from-access-token.js'
import requireBodyParts from '../middlewares/require-body-parts.js'
import requireSubject from '../middlewares/require-subject.js'
import saveSubject from '../middlewares/save-subject.js'
import promote from '../middlewares/promote.js'
import requireAdmin from '../middlewares/require-admin.js'
import requireEmail from '../middlewares/require-email.js'
import requireSelfOrAdmin from '../middlewares/require-self-or-admin.js'
import requireUser from '../middlewares/require-user.js'
import sendEmailVerification from '../middlewares/send-email-verification.js'
import setPassword from '../middlewares/set-password.js'
import updateSubjectName from '../middlewares/update-subject-name.js'
import updateSubjectPassword from '../middlewares/update-subject-password.js'
import verifyEmail from '../middlewares/verify-email.js'

const pkg = await loadPackage()
const { root } = getAPIInfo(pkg)
const router = Router()

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: "The data model that the API uses when returning user data."
 *       properties:
 *         id:
 *           type: string
 *           description: "The user's unique 24-digit hexadecimal ID number."
 *           example: "0123456789abcdef12345678"
 *         name:
 *           type: string
 *           description: "The user's name."
 *           example: "Alice"
 *         active:
 *           type: boolean
 *           description: "This flag tells you if this is an active user. Deactivated users cannot log in. _(Default: `true`)_"
 *           example: true
 *         admin:
 *           type: boolean
 *           description: "This flag tells you if this user has administrative privileges. _(Default: `false`)_"
 *           example: false
 *     UserCreate:
 *       type: object
 *       description: "The model that the API uses to create a new user."
 *       properties:
 *         name:
 *           type: string
 *           description: "The user's name."
 *           example: "Alice"
 *         email:
 *           type: string
 *           description: "The user's email address."
 *           example: "alice@example.com"
 *         password:
 *           type: string
 *           description: "The password that the user would like to use to authenticate. This is submitted in plaintext and then hashed on the server before it is stored, so user creation requests **must** be submitted over an SSL-protected connection to be secure."
 *           example: "Longer passwords are better passwords."
 *     Email:
 *       type: object
 *       description: "The record for any one of a user's email addresses."
 *       properties:
 *         addr:
 *           type: string
 *           description: "The user's email address."
 *           example: "user@taggerkeeper.com"
 *         verified:
 *           type: boolean
 *           description: "A boolean flag that indicates if the user has verified this address."
 *     EmailVerification:
 *       type: object
 *       description: "The code to provide to verify your email address."
 *       properties:
 *         code:
 *           type: string
 *           description: "The email verification code."
 *           example: "abcde12345"
 */

// /users

const collection = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  post: (req: Request, res: Response) => {
    const { subject } = req
    res.set('Location', `${root}/users/${subject?.id ?? ''}`)
    res.status(201).send(subject?.getPublicObj())
  }
}

router.all('/', allow(collection))

/**
 * @openapi
 * /users:
 *   options:
 *     summary: "Methods for the Users collection."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - users
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
 * /users:
 *   post:
 *     tags:
 *       - users
 *     summary: "Create a new user."
 *     description: "Create a new user with the name, email, and password provided."
 *     requestBody:
 *       description: "The information you provide will be used to create a new user."
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserCreate"
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: "#/components/schemas/UserCreate"
 *     responses:
 *       201:
 *         description: "A new user was created."
 *         headers:
 *           'Location':
 *             schema:
 *               type: string
 *               example: "https://taggerkeeper.com/v1/users/0123456789abcdef12345678"
 *             description: "Where the new resource can be found."
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
 *               $ref: "#/components/schemas/User"
 *       400:
 *         description: "This method requires 'name', 'email'. and 'password' properties in the body. You will receive this error if one or more of these properties is missing from the request."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This method requires a body with elements 'name', 'email', 'password'"
 */

router.post('/', requireBodyParts('name', 'email', 'password') as any, createUser, setPassword, addEmail, saveSubject, sendEmailVerification, requireSubject, collection.post)

// /users/:uid

const item = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.getPublicObj())
  },
  put: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.getPublicObj())
  }
}

router.all('/:uid', allow(item))

/**
 * @openapi
 * /users/{uid}:
 *   options:
 *     summary: "Methods for a Users item."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - users
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "No user ID (uid) was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       404:
 *         description: "The requested user could not be found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.options('/:uid', loadSubject, requireSubject, item.options)

/**
 * @openapi
 * /users/{uid}:
 *   head:
 *     summary: "Return headers for a user."
 *     description: "Returns the headers that a user would receive if requesting a Users item."
 *     tags:
 *       - users
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       204:
 *         description: "The user requested was found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "No user ID (uid) was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       404:
 *         description: "The requested user could not be found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.head('/:uid', loadSubject, requireSubject, item.head)

/**
 * @openapi
 * /users/{uid}:
 *   get:
 *     summary: "Return a user."
 *     description: "Return a user."
 *     tags:
 *       - users
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "The user requested was found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       400:
 *         description: "No user ID (uid) was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       404:
 *         description: "The requested user could not be found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.get('/:uid', loadSubject, requireSubject, item.get)

/**
 * @openapi
 * /users/{uid}:
 *   put:
 *     summary: "Update a user."
 *     description: "Update a user's name and/or password. This method can only be used while authenticated as the subject or as an administrator."
 *     tags:
 *       - users
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "The user has been updated."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       400:
 *         description: "No user ID (uid) was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.put('/:uid', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, updateSubjectName, updateSubjectPassword, saveSubject, item.put)

// /users/:uid/emails

const emails = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    const emails = req.subject?.emails.map(email => ({ addr: email.addr, verified: email.verified }))
    res.status(200).send(emails)
  },
  post: (req: Request, res: Response) => {
    const { subject } = req
    const emails = subject?.emails.map(email => ({ addr: email.addr, verified: email.verified }))
    res.set('Location', `${root}/users/${subject?.id ?? ''}/emails/${req.body.email as string}`)
    res.status(201).send(emails)
  }
}

router.all('/:uid/emails', allow(emails))

/**
 * @openapi
 * /users/{uid}/emails:
 *   options:
 *     summary: "Methods for the Emails collection."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.options('/:uid/emails', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, emails.options)

/**
 * @openapi
 * /users/{uid}/emails:
 *   head:
 *     summary: "Returns the headers for the Emails collection."
 *     description: "Returns the headers that a user would receive if requesting a user's Emails collection."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       204:
 *         description: "The user requested was found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.head('/:uid/emails', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, emails.head)

/**
 * @openapi
 * /users/{uid}/emails:
 *   get:
 *     summary: "Return an array of a User's emails."
 *     description: "Return an array of a User's emails."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "The user requested was found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Email"
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.get('/:uid/emails', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, emails.get)

/**
 * @openapi
 * /users/{uid}/emails:
 *   post:
 *     summary: "Add a new email."
 *     description: "Add a new email to a user's record. This also sends an email to the address given asking the owner to verify it."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       201:
 *         description: "The email was added to the user record."
 *         headers:
 *           'Location':
 *             schema:
 *               type: string
 *               example: "https://taggerkeeper.com/v1/users/0123456789abcdef12345678/emails/user@taggerkeeper.com"
 *             description: "Where the new email can be found."
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, POST"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Email"
 *             description: "An array of the user's emails, including the one that was just added."
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.post('/:uid/emails', loadUserFromAccessToken, requireUser, requireBodyParts('email') as any, loadSubject, requireSubject, requireSelfOrAdmin, addEmail, sendEmailVerification, saveSubject, emails.post)

// /users/:uid/emails/:addr

const email = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    if (req.email === undefined) {
      res.status(500).send({ message: 'No email address provided.' })
    } else {
      const { addr, verified } = req.email
      res.status(200).send({ addr, verified })
    }
  },
  put: (req: Request, res: Response) => {
    if (req.email === undefined) {
      res.status(500).send({ message: 'No email address provided.' })
    } else {
      const { addr, verified } = req.email
      res.status(200).send({ addr, verified })
    }
  },
  delete: (req: Request, res: Response) => {
    const emails = req.subject?.emails.map(email => ({ addr: email.addr, verified: email.verified }))
    res.status(200).send(emails)
  }
}

router.all('/:uid/emails/:addr', allow(email))

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   options:
 *     summary: "Methods for an Emails item."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's email address that you're interested in."
 *         example: "tester@testing.com"
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "No user ID (uid) or email address was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user or email address could not be found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.options('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, email.options)

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   head:
 *     summary: "Returns the headers for an Emails item."
 *     description: "Returns the headers that a user would receive if requesting a user's Email record."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's email address that you're interested in."
 *         example: "tester@testing.com"
 *     responses:
 *       204:
 *         description: "The user's requested email record was found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "No user ID (uid) or email address was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user or email address could not be found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.head('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, getEmail, requireEmail, email.head)

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   get:
 *     summary: "Get a User's individual email record."
 *     description: "Get a User's individual email record."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's email address that you're interested in."
 *         example: "tester@testing.com"
 *     responses:
 *       200:
 *         description: "The user's requested email record was found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Email"
 *       400:
 *         description: "No user ID (uid) or email address was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user or email address could not be found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.get('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, getEmail, requireEmail, email.get)

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   put:
 *     summary: "Verify an email address."
 *     description: "Verify an email address."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's email address that you're interested in."
 *         example: "tester@testing.com"
 *     requestBody:
 *       description: "Your verification code."
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/EmailVerification"
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: "#/components/schemas/EmailVerification"
 *     responses:
 *       200:
 *         description: "The user's email was verified."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Email"
 *       400:
 *         description: "No user ID (uid) or email address was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user or email address could not be found."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.put('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, getEmail, verifyEmail, saveSubject, email.put)

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   delete:
 *     summary: "Delete an email address."
 *     description: "Delete an email address."
 *     tags:
 *       - users/emails
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's email address that you're interested in."
 *         example: "tester@testing.com"
 *     responses:
 *       200:
 *         description: "The user's email has been deleted."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Email"
 *       400:
 *         description: "No user ID (uid) or email address was provided."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET, PUT, DELETE"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user or email address could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.delete('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, dropEmail, saveSubject, email.delete)

// /users/:uid/admin

const admin = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.admin)
  },
  post: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.getPublicObj())
  },
  delete: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.getPublicObj())
  }
}

router.all('/:uid/admin', allow(admin))

/**
 * @openapi
 * /users/{uid}/admin:
 *   options:
 *     summary: "Methods for the Admin endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - users/admin
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
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
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.options('/:uid/admin', loadSubject, requireSubject, admin.options)

/**
 * @openapi
 * /users/{uid}/admin:
 *   head:
 *     summary: "Return headers for a user's Admin status."
 *     description: "Returns the headers that a user would receive if requesting Admin status."
 *     tags:
 *       - users/admin
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       204:
 *         description: "The user requested was found."
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
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.head('/:uid/admin', loadSubject, requireSubject, admin.head)

/**
 * @openapi
 * /users/{uid}/admin:
 *   get:
 *     summary: "Is this user an administrator?"
 *     description: "Return a boolean flag that indicates if the user is an administrator or not."
 *     tags:
 *       - users/admin
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "A boolean flag that indicates if the user is an administrator or not."
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
 *               type: boolean
 *               description: "A boolean flag that indicates if the user is an administrator or not."
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.get('/:uid/admin', loadSubject, requireSubject, admin.get)

/**
 * @openapi
 * /users/{uid}/admin:
 *   post:
 *     summary: "Promote a user to an administrator."
 *     description: "Promote a user to an administrator. This can only be done by an authenticated administrator."
 *     tags:
 *       - users/admin
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "The user has been promoted to administrator."
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
 *               $ref: "#/components/schemas/User"
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
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
 *         description: "This endpoint can only be used by an administrator."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.post('/:uid/admin', loadUserFromAccessToken, requireUser, requireAdmin, loadSubject, requireSubject, promote, saveSubject, admin.post)

/**
 * @openapi
 * /users/{uid}/admin:
 *   delete:
 *     summary: "Demote an administrator."
 *     description: "Demote an administrator. This can only be done by an authenticated administrator."
 *     tags:
 *       - users/admin
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "The user has been demoted from administrator."
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
 *               $ref: "#/components/schemas/User"
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.delete('/:uid/admin', loadUserFromAccessToken, requireUser, requireAdmin, loadSubject, requireSubject, demote, saveSubject, admin.post)

// /users/:uid/active

const active = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.active)
  },
  post: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.getPublicObj())
  },
  delete: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.getPublicObj())
  }
}

router.all('/:uid/active', allow(active))

/**
 * @openapi
 * /users/{uid}/active:
 *   options:
 *     summary: "Methods for the Active endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - users/active
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
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
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.options('/:uid/active', loadSubject, requireSubject, active.options)

/**
 * @openapi
 * /users/{uid}/active:
 *   head:
 *     summary: "Return headers for a user's Active status."
 *     description: "Returns the headers that a user would receive if requesting Active status."
 *     tags:
 *       - users/active
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       204:
 *         description: "The user requested was found."
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
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.head('/:uid/active', loadSubject, requireSubject, active.head)

/**
 * @openapi
 * /users/{uid}/active:
 *   get:
 *     summary: "Is this user active?"
 *     description: "Return a boolean flag that indicates if the user is active or not."
 *     tags:
 *       - users/active
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "A boolean flag that indicates if the user is active or not."
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
 *               type: boolean
 *               description: "A boolean flag that indicates if the user is active or not."
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.get('/:uid/active', loadSubject, requireSubject, active.get)

/**
 * @openapi
 * /users/{uid}/active:
 *   post:
 *     summary: "Activate a user."
 *     description: "Activate a user. This can only be done by an authenticated administrator."
 *     tags:
 *       - users/active
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "The user has been activated."
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
 *               $ref: "#/components/schemas/User"
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.post('/:uid/active', loadUserFromAccessToken, requireUser, requireAdmin, loadSubject, requireSubject, activate, saveSubject, active.post)

/**
 * @openapi
 * /users/{uid}/active:
 *   delete:
 *     summary: "Deactivate a user."
 *     description: "Deactivate a user. This can only be done by an authenticated administrator."
 *     tags:
 *       - users/active
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The user's unique 24-digit hexadecimal ID number."
 *         example: "0123456789abcdef12345678"
 *     responses:
 *       200:
 *         description: "The user requested was found."
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
 *               $ref: "#/components/schemas/User"
 *       400:
 *         description: "No user ID (uid) was provided."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user ID (uid) provided."
 *       401:
 *         description: "This method requires authentication."
 *         headers:
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
 *         description: "This endpoint can only be used by the subject or an administrator."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "This endpoint can only be used by the subject or an administrator."
 *
 *       404:
 *         description: "The requested user could not be found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "No user found with the ID 0123456789abcdef12345678."
 */

router.delete('/:uid/active', loadUserFromAccessToken, requireUser, requireAdmin, loadSubject, requireSubject, deactivate, saveSubject, active.post)

export default router
