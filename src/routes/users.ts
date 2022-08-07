import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow'

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
 *           description: "The password that the user would like to use to authenticate. This is submitted in plaintext and then hashed on the server before it is stored, so user creation requests **must** be submitted over an SSL-protected connection to be secure.
 *           example: "Longer passwords are better passwords."
 */

// /users

const collection = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
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

export default router
