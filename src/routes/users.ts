import { Request, Response, Router } from 'express'

import loadPackage from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'

import addEmail from '../middlewares/add-email.js'
import allow from '../middlewares/allow.js'
import createUser from '../middlewares/create-user.js'
import saveSubject from '../middlewares/save-subject.js'
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
 */

// /users

const collection = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  post: (req: Request, res: Response) => {
    const { subject } = req
    const status = subject !== undefined ? 201 : 500
    const body = subject !== undefined ? subject.getPublicObj() : { message: 'No new user was created.' }
    if (subject !== undefined) res.set('Location', `${root}/users/${subject.id ?? ''}`)
    res.status(status).send(body)
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

router.post('/', createUser, setPassword, addEmail, saveSubject, collection.post)

// /users/:uid

const item = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    const { subject } = req
    const { uid } = req.params
    const status = subject !== undefined ? 200 : 404
    const message = uid !== undefined ? `No user found with the ID ${uid}.` : 'No user ID (uid) provided.'
    const body = subject !== undefined ? subject.getPublicObj() : { message }
    res.status(status).send(body)
  }
}

router.all('/:uid', allow(item))

/**
 * @openapi
 * /users/{uid}:
 *   options:
 *     summary: "Return options on how to use the Users collection."
 *     description: "Return which options are permissible for the Users collection."
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
 *               example: "OPTIONS, POST"
 */

router.options('/:uid', item.options)

export default router
