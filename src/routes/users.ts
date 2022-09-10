import { Request, Response, Router } from 'express'

import loadPackage from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'

import addEmail from '../middlewares/add-email.js'
import allow from '../middlewares/allow.js'
import createUser from '../middlewares/create-user.js'
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
 *               description: "The methods allowed for the individual user endpoint."
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
 *         description: "The user requested was found."
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
 *         description: "The user requested was found."
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
    res.sendStatus(204)
  },
  post: (req: Request, res: Response) => {
    res.status(200).send(req.subject?.emails)
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
 *               description: "The methods allowed for the user's emails collection endpoint."
 *               example: "OPTIONS, GET, HEAD, POST"
 */

router.options('/:uid/emails', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, emailCollection.options)

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
 *       204:
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

/**
 * @openapi
 * /users/{uid}/emails:
 *   post:
 *     summary: "Add a new email to a user."
 *     description: "Add a new email to a user."
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
 *         description: "The email was added to the user record."
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Email"
 */

router.post('/:uid/emails', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, addEmail, sendEmailVerification, saveSubject, emailCollection.post)

// /users/:uid/emails/:addr

const emailItem = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    res.status(200).send(req.email)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  post: (req: Request, res: Response) => {
    res.status(200).send(req.email)
  },
  delete: (req: Request, res: Response) => {
    res.status(200).send(req.subject?.emails)
  }
}

router.all('/:uid/emails/:addr', allow(emailItem))

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   options:
 *     summary: "Return options on how to use a User's individual email record."
 *     description: "Return which options are permissible for a User's individual email record."
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
 *               description: "The methods allowed for the user's admin endpoint."
 *               example: "OPTIONS, GET, HEAD, POST, DELETE"
 */

router.options('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, emailItem.options)

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   head:
 *     summary: "Get a User's individual email record."
 *     description: "Get the headers that you would receive if you were to request a User's individual email record."
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
 */

router.head('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, getEmail, requireEmail, emailItem.head)

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   get:
 *     summary: "Get a User's individual email record."
 *     description: "Get a User's individual email record."
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Email"
 */

router.get('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, getEmail, requireEmail, emailItem.get)

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   post:
 *     summary: "Verify an email address."
 *     description: "Verify an email address."
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Email"
 */

router.post('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, getEmail, verifyEmail, saveSubject, emailItem.get)

/**
 * @openapi
 * /users/{uid}/emails/{addr}:
 *   delete:
 *     summary: "Deletes an email address."
 *     description: "Delete an email address."
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Email"
 */

router.delete('/:uid/emails/:addr', loadUserFromAccessToken, requireUser, loadSubject, requireSubject, requireSelfOrAdmin, dropEmail, saveSubject, emailItem.delete)

// /users/:uid/admin

const admin = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.admin)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
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
 *     summary: "Return options on how to use a User's admin endpoint."
 *     description: "Return options on how to use a User's admin endpoint."
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
 *               description: "The methods allowed for the user's individual email endpoint."
 *               example: "OPTIONS, POST, DELETE"
 */

router.options('/:uid/admin', loadSubject, requireSubject, admin.options)

/**
 * @openapi
 * /users/{uid}/admin:
 *   head:
 *     summary: "Return the headers that you would receive if you requested a user's admin status."
 *     description: "Return the headers that you would receive if you requested a user's admin status."
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
 *         description: "The user requested was found."
 */

router.head('/:uid/admin', loadSubject, requireSubject, admin.head)

/**
 * @openapi
 * /users/{uid}/admin:
 *   get:
 *     summary: "Return a boolean flag that indicates if the user is an administrator or not."
 *     description: "Return a boolean flag that indicates if the user is an administrator or not."
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
 *         description: "A boolean flag that indicates if the user is an administrator or not."
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *               description: "A boolean flag that indicates if the user is an administrator or not."
 */

router.get('/:uid/admin', loadSubject, requireSubject, admin.get)

/**
 * @openapi
 * /users/{uid}/admin:
 *   post:
 *     summary: "Promote a user to an administrator."
 *     description: "Promote a user to an administrator."
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
 *               $ref: "#/components/schemas/User"
 */

router.post('/:uid/admin', loadUserFromAccessToken, requireUser, requireAdmin, loadSubject, requireSubject, promote, saveSubject, admin.post)

/**
 * @openapi
 * /users/{uid}/admin:
 *   delete:
 *     summary: "Demote an administrator."
 *     description: "Demote an administrator."
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
 *               $ref: "#/components/schemas/User"
 */

router.delete('/:uid/admin', loadUserFromAccessToken, requireUser, requireAdmin, loadSubject, requireSubject, demote, saveSubject, admin.post)

// /users/:uid/active

const active = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    const { subject } = req
    res.status(200).send(subject?.active)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  }
}

router.all('/:uid/active', allow(active))

/**
 * @openapi
 * /users/{uid}/active:
 *   options:
 *     summary: "Return options on how to use a User's active endpoint."
 *     description: "Return options on how to use a User's active endpoint."
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
 *               description: "The methods allowed for the user's active endpoint."
 *               example: "OPTIONS, POST, DELETE"
 */

router.options('/:uid/active', loadSubject, requireSubject, active.options)

/**
 * @openapi
 * /users/{uid}/active:
 *   get:
 *     summary: "Return a boolean flag that indicates if the user is active or not."
 *     description: "Return a boolean flag that indicates if the user is active or not."
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
 *         description: "The user requested was found."
 */

router.head('/:uid/active', loadSubject, requireSubject, active.head)

/**
 * @openapi
 * /users/{uid}/active:
 *   get:
 *     summary: "Return a boolean flag that indicates if the user is active or not."
 *     description: "Return a boolean flag that indicates if the user is active or not."
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
 *         description: "A boolean flag that indicates if the user is active or not."
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *               description: "A boolean flag that indicates if the user is active or not."
 */

router.get('/:uid/active', loadSubject, requireSubject, active.get)

export default router
