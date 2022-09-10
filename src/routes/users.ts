import { Request, Response, Router } from 'express'

import loadPackage from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'

import addEmail from '../middlewares/add-email.js'
import allow from '../middlewares/allow.js'
import createUser from '../middlewares/create-user.js'
import loadSubject from '../middlewares/load-subject.js'
import loadUserFromAccessToken from '../middlewares/load-user-from-access-token.js'
import requireBodyParts from '../middlewares/require-body-parts.js'
import requireSubject from '../middlewares/require-subject.js'
import saveSubject from '../middlewares/save-subject.js'
import requireSelfOrAdmin from '../middlewares/require-self-or-admin.js'
import requireUser from '../middlewares/require-user.js'
import sendEmailVerification from '../middlewares/send-email-verification.js'
import setPassword from '../middlewares/set-password.js'

const pkg = await loadPackage()
const { root } = getAPIInfo(pkg)
const router = Router()

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: This is the data model that the API uses when returning user data.
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
 *       description: This is the data model that you can use to submit data to the API to create a new user.
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
 *       description: The records we have for any one of a user's email addresses.
 *       properties:
 *         addr:
 *           type: string
 *           description: "The user's email address."
 *           example: "user@taggerkeeper.com"
 *         verified:
 *           type: boolean
 *           description: "A boolean flag that indicates if the user has verified this address."
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
 *     summary: "Return options on how to use the Users collection."
 *     description: "Return which options are permissible for the Users collection."
 *     tags:
 *       - "Users"
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               description: "The methods allowed for the users endpoint."
 *               example: "OPTIONS, POST"
 */

router.options('/', collection.options)

/**
 * @openapi
 * /users:
 *   post:
 *     tags:
 *       - "Users"
 *     summary: "Create a new user."
 *     description: "Create a new user."
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 */

router.post('/', requireBodyParts('name', 'email', 'password') as any, createUser, setPassword, addEmail, saveSubject, sendEmailVerification, requireSubject, collection.post)

// /users/:uid

const item = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.getPublicObj())
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  }
}

router.all('/:uid', allow(item))

/**
 * @openapi
 * /users/{uid}:
 *   options:
 *     summary: "Return options on how to use an individual User."
 *     description: "Return which options are permissible for an individual User."
 *     tags:
 *       - "Users"
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
 *               description: "The methods allowed for the users endpoint."
 *               example: "OPTIONS, GET, HEAD"
 */

router.options('/:uid', loadSubject, requireSubject, item.options)

/**
 * @openapi
 * /users/{uid}:
 *   head:
 *     summary: "Return headers for a user."
 *     description: "Return headers for a user."
 *     tags:
 *       - "Users"
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
 *         description: "THe user requested was found."
 */

router.head('/:uid', loadSubject, requireSubject, item.head)

/**
 * @openapi
 * /users/{uid}:
 *   get:
 *     summary: "Return a user."
 *     description: "Return a user."
 *     tags:
 *       - "Users"
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
 *         description: "THe user requested was found."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 */

router.get('/:uid', loadSubject, requireSubject, item.get)

// /users/:uid/emails

const emailCollection = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    res.status(200).send(req.subject?.emails)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(201)
  }
}

router.all('/:uid/emails', allow(emailCollection))

/**
 * @openapi
 * /users/{uid}/emails:
 *   options:
 *     summary: "Return options on how to use a User's emails collection."
 *     description: "Return which options are permissible for a User's emails collection."
 *     tags:
 *       - "Users"
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
 *               description: "The methods allowed for the users endpoint."
 *               example: "OPTIONS, GET, HEAD"
 */

router.options('/:uid/emails', loadSubject, requireSubject, emailCollection.options)

/**
 * @openapi
 * /users/{uid}/emails:
 *   head:
 *     summary: "Returns the headers you would receive if you were to request an array of a User's emails."
 *     description: "Returns the headers you would receive if you were to request an array of a User's emails."
 *     tags:
 *       - "Users"
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
 *         description: "The user requested was found."
 */

router.head('/:uid/emails', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, emailCollection.head)

/**
 * @openapi
 * /users/{uid}/emails:
 *   get:
 *     summary: "Return an array of a User's emails."
 *     description: "Return an array of a User's emails."
 *     tags:
 *       - "Users"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Email"
 */

router.get('/:uid/emails', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, emailCollection.get)

export default router
