import { Request, Response, Router } from 'express'
import expressAsyncHandler from 'express-async-handler'

import loadPackage from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'

import addSearchPagination from '../middlewares/add-search-pagination.js'
import allow from '../middlewares/allow.js'
import createPage from '../middlewares/create-page.js'
import getRevisionFromBody from '../middlewares/get-revision-from-body.js'
import loadPage from '../middlewares/load-page.js'
import loadUserFromAccessToken from '../middlewares/load-user-from-access-token.js'
import requirePage from '../middlewares/require-page.js'
import requirePageRead from '../middlewares/require-page-read.js'
import requirePageWrite from '../middlewares/require-page-write.js'
import requireValidPath from '../middlewares/require-valid-path.js'
import savePage from '../middlewares/save-page.js'
import searchPages from '../middlewares/search-pages.js'
import trashPage from '../middlewares/trash-page.js'
import updatePage from '../middlewares/update-page.js'

const router = Router()

/**
 * @openapi
 * components:
 *   schemas:
 *     Page:
 *       type: object
 *       description: "The data model that the API uses when returning page data."
 *       properties:
 *         id:
 *           type: string
 *           description: "The page's unique 24-digit hexadecimal ID number."
 *           example: "0123456789abcdef12345678"
 *         revisions:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/Revision"
 *           created:
 *             type: number
 *             description: "The timestamp of when this page was created (measured as milliseconds since January 1, 1970)."
 *             example: 1663863528000
 *           updated:
 *             type: number
 *             description: "The timestamp of when this page was most recently updated (measured as milliseconds since January 1, 1970)."
 *             example: 1663863528000
 *     Revision:
 *       type: object
 *       description: "A page revision."
 *       properties:
 *         content:
 *           $ref: "#/components/schemas/RevisionContent"
 *         permissions:
 *           $ref: "#/components/schemas/RevisionPermissions"
 *         editor:
 *           description: "The user who made this revision."
 *           $ref: "#/components/schemas/User"
 *         msg:
 *           type: string
 *           description: "A message explaining the purpose and intent of the revision."
 *           example: "Initial text"
 *         timestamp:
 *           type: number
 *           description: "The timestamp of when the revision was made (measured as milliseconds since January 1, 1970)."
 *           example: 1663863528000
 *     RevisionContent:
 *       type: object
 *       description: "The content of a page revision."
 *       properties:
 *         title:
 *           type: string
 *           description: "The page's title (as of this revision)."
 *           example: "Example Page"
 *         path:
 *           type: string
 *           description: "The page's unique path (as of this revision)."
 *           example: "/example-page"
 *         body:
 *           type: string
 *           description: "The content of the page (as of this revision)."
 *           example: "This page is an example."
 *     RevisionPermissions:
 *       type: object
 *       description: "The page permissions (as of this revision)."
 *       properties:
 *         read:
 *           type: string
 *           enum: [anyone, authenticated, editor, admin]
 *           description: "Read permissions for this page (as of this revision)."
 *         write:
 *           type: string
 *           enum: [anyone, authenticated, editor, admin]
 *           description: "Write permissions for this page (as of this revision)."
 *     RevisionInput:
 *       type: object
 *       description: "The information that a user is expected to supply in order to create a new page revision."
 *       properties:
 *         content:
 *           $ref: "#/components/schemas/RevisionContent"
 *         permissions:
 *           $ref: "#/components/schemas/RevisionPermissions"
 *         msg:
 *           type: string
 *           description: "A message explaining the purpose and intent of the revision."
 *           example: "Initial text"
 *     InvalidPath:
 *       type: object
 *       description: "An error message describing the problems with the invalid path that you provided."
 *       properties:
 *         message:
 *           type: string
 *           description: "A description of the error."
 *           example: "A null string is not a valid path."
 *         path:
 *           type: string
 *           description: "The path that you provided."
 *           example: "/invalid-path"
 */

// /pages

const collection = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  get: (req: Request, res: Response) => {
    res.status(200).send(req.searchResults)
  },
  post: expressAsyncHandler(async (req: Request, res: Response) => {
    const pkg = await loadPackage()
    const { root } = getAPIInfo(pkg)
    res.set('Location', `${root}/pages/${req.page?.id ?? ''}`)
    res.status(201).send(req.page?.getPublicObj())
  })
}

router.all('/', allow(collection))

/**
 * @openapi
 * /pages:
 *   options:
 *     summary: "Methods for the Pages collection endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - pages
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
 */

router.options('/', collection.options)

/**
 * @openapi
 * /pages:
 *   head:
 *     summary: "Headers for search."
 *     description: "This endpoint allows users to run a search, but only return the headers for it."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: query
 *         name: created-before
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages created before this time (measured as milliseconds since January 1, 1970)."
 *         example: 1663863528000
 *       - in: query
 *         name: created-after
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages created after this time (measured as milliseconds since January 1, 1970)."
 *         example: 1663863528000
 *       - in: query
 *         name: updated-before
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages most recently updated before this time (measured as milliseconds since January 1, 1970)."
 *         example: 1663863528000
 *       - in: query
 *         name: updated-after
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages most recently updated after this time (measured as milliseconds since January 1, 1970)."
 *         example: 1663863528000
 *       - in: query
 *         name: revisions-minimum
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages that have this many revisions or more."
 *         example: 1
 *       - in: query
 *         name: revisions-maximum
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages that have this many revisions or fewer."
 *         example: 10
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: "Return no more than this many pages in each response."
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *         description: "Offset the returned set by this many (e.g., start the returned set at this index)."
 *         example: 150
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created, -created, updated, -updated, alphabetical, -alphabetical, relevance]
 *         description: "Specifies how the results should be sorted. Options that begin with a minus sign are inverted (e.g., `-created` means in reverse chronological order by time when the page was created). The `relevance` option only works when you also provide a `text` parameter to search for."
 *         example: alphabetical
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *         description: "A search string."
 *         example: Poughkeepsie
 *       - in: query
 *         name: trashed
 *         schema:
 *           type: boolean
 *         description: "If set, only return pages that have been marked for deletion. Only administrators can see pages that have been marked for deletion, so if you're not an administrator this option is ignored."
 *         example: true
 *     security:
 *       - bearerAuth: []
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
 *           'Link':
 *             schema:
 *               type: string
 *               example: <https://taggerkeeper.com/v1/pages?text=example&offset=0&limit=50>; rel="first"
 *             description: "Links to the first, previous, next, and last pages in the search set, as appropriate."
 */

router.head('/', loadUserFromAccessToken, searchPages, addSearchPagination, collection.head)

/**
 * @openapi
 * /pages:
 *   get:
 *     summary: "Headers for search."
 *     description: "This endpoint allows users to run a search, but only return the headers for it."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: query
 *         name: created-before
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages created before this time (measured as milliseconds since January 1, 1970)."
 *         example: 1663863528000
 *       - in: query
 *         name: created-after
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages created after this time (measured as milliseconds since January 1, 1970)."
 *         example: 1663863528000
 *       - in: query
 *         name: updated-before
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages most recently updated before this time (measured as milliseconds since January 1, 1970)."
 *         example: 1663863528000
 *       - in: query
 *         name: updated-after
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages most recently updated after this time (measured as milliseconds since January 1, 1970)."
 *         example: 1663863528000
 *       - in: query
 *         name: revisions-minimum
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages that have this many revisions or more."
 *         example: 1
 *       - in: query
 *         name: revisions-maximum
 *         schema:
 *           type: number
 *         description: "Limit results to only those pages that have this many revisions or fewer."
 *         example: 10
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: "Return no more than this many pages in each response."
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *         description: "Offset the returned set by this many (e.g., start the returned set at this index)."
 *         example: 150
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created, -created, updated, -updated, alphabetical, -alphabetical, relevance]
 *         description: "Specifies how the results should be sorted. Options that begin with a minus sign are inverted (e.g., `-created` means in reverse chronological order by time when the page was created). The `relevance` option only works when you also provide a `text` parameter to search for."
 *         example: alphabetical
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *         description: "A search string."
 *         example: Poughkeepsie
 *       - in: query
 *         name: trashed
 *         schema:
 *           type: boolean
 *         description: "If set, only return pages that have been marked for deletion. Only administrators can see pages that have been marked for deletion, so if you're not an administrator this option is ignored."
 *         example: true
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
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
 *           'Link':
 *             schema:
 *               type: string
 *               example: <https://taggerkeeper.com/v1/pages?text=example&offset=0&limit=50>; rel="first"
 *             description: "Links to the first, previous, next, and last pages in the search set, as appropriate."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   description: "The total number of pages found by your query."
 *                   example: 1000
 *                 start:
 *                   type: number
 *                   description: "The index of the first page in the current set in the total set."
 *                   example: 0
 *                 end:
 *                   type: number
 *                   description: "The index of the last page in the current set in the total set."
 *                   example: 50
 *                 pages:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Page"
 */

router.get('/', loadUserFromAccessToken, searchPages, addSearchPagination, collection.get)

/**
 * @openapi
 * /pages:
 *   post:
 *     summary: "Create a new page."
 *     description: "Create a new page."
 *     tags:
 *       - pages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           $ref: '#/components/schemas/RevisionInput'
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: "#/components/schemas/RevisionInput"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
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
 *           'Location':
 *             schema:
 *               type: string
 *               example: https://taggerkeeper.com/v1/pages/012345abcdef012345abcdef
 *             description: "Link to the newly created page."
 */

router.post('/', loadUserFromAccessToken, getRevisionFromBody, createPage, requirePage, savePage, collection.post)

// /pages/:pid

const item = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(200)
  },
  get: (req: Request, res: Response) => {
    res.status(200).send(req.page?.getPublicObj())
  },
  put: (req: Request, res: Response) => {
    res.status(200).send(req.page?.getPublicObj())
  },
  delete: (req: Request, res: Response) => {
    res.status(200).send(req.page?.getPublicObj())
  }
}

router.all('/:pid', allow(item))

/**
 * @openapi
 * /pages/{pid}:
 *   options:
 *     summary: "Methods for the Pages item endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The page's unique path or 24-digit hexadecimal ID number."
 *         examples:
 *           pid:
 *             value: "0123456789abcdef12345678"
 *             summary: "The page's unique 24-digit hexadecimal ID number."
 *           path:
 *             value: "/path/to/page"
 *             summary: "The page's unique path."
 *     security:
 *       - bearerAuth: []
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
 */

router.options('/:pid', loadUserFromAccessToken, requireValidPath, loadPage, requirePageRead, item.options)

/**
 * @openapi
 * /pages/{pid}:
 *   head:
 *     summary: "Return the headers for a page."
 *     description: "Return the headers for a page."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The page's unique path or 24-digit hexadecimal ID number."
 *         examples:
 *           pid:
 *             value: "0123456789abcdef12345678"
 *             summary: "The page's unique 24-digit hexadecimal ID number."
 *           path:
 *             value: "/path/to/page"
 *             summary: "The page's unique path."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
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
 *         description: "You have provided an invalid path."
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
 *       401:
 *         description: "Only authenticated users can view this page, but you are not authenticated."
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
 *             description: "This header is informing you that you must pass a valid access token as the Bearer header to this request. To obtain a valid access token, see the `POST /tokens` method."
 *       403:
 *         description: "You do not have permission to view this page."
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
 *
 */

router.head('/:pid', loadUserFromAccessToken, requireValidPath, loadPage, requirePageRead, item.head)

/**
 * @openapi
 * /pages/{pid}:
 *   get:
 *     summary: "Return a page."
 *     description: "Return a page."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The page's unique path or 24-digit hexadecimal ID number."
 *         examples:
 *           pid:
 *             value: "0123456789abcdef12345678"
 *             summary: "The page's unique 24-digit hexadecimal ID number."
 *           path:
 *             value: "/path/to/page"
 *             summary: "The page's unique path."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
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
 *               $ref: "#/components/schemas/Page"
 *       400:
 *         description: "You have provided an invalid path."
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
 *               $ref: "#/components/schemas/InvalidPath"
 *       401:
 *         description: "Only authenticated users can view this page, but you are not authenticated."
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
 *             description: "This header is informing you that you must pass a valid access token as the Bearer header to this request. To obtain a valid access token, see the `POST /tokens` method."
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
 *         description: "You do not have permission to view this page."
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
 *                   example: "You do not have permission to view this page."
 */

router.get('/:pid', loadUserFromAccessToken, requireValidPath, loadPage, requirePageRead, item.get)

/**
 * @openapi
 * /pages/{pid}:
 *   put:
 *     summary: "Update a page."
 *     description: "The most common use for this method is to update a page, but you can also call this method for a page without any update if it has been marked for deletion, in which case it will be unmarked. Both of these functions require the user to have write permissions for the page."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The page's unique path or 24-digit hexadecimal ID number."
 *         examples:
 *           pid:
 *             value: "0123456789abcdef12345678"
 *             summary: "The page's unique 24-digit hexadecimal ID number."
 *           path:
 *             value: "/path/to/page"
 *             summary: "The page's unique path."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: "Calling this method without a body can be effective if the page was marked for deletion (in which case calling this method will unmark it, if you have permission to update it). If the page is not marked for deletion, then calling this method without an update will have no effect."
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RevisionInput'
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: "#/components/schemas/RevisionInput"
 *     responses:
 *       200:
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
 *               $ref: "#/components/schemas/Page"
 *       400:
 *         description: "You have provided an invalid path."
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
 *               $ref: "#/components/schemas/InvalidPath"
 *       401:
 *         description: "Only authenticated users can view this page, but you are not authenticated."
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
 *             description: "This header is informing you that you must pass a valid access token as the Bearer header to this request. To obtain a valid access token, see the `POST /tokens` method."
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
 *         description: "You do not have permission to view this page."
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
 *                   example: "You do not have permission to view this page."
 */

router.put('/:pid', loadUserFromAccessToken, requireValidPath, loadPage, requirePageWrite, getRevisionFromBody, updatePage, savePage, item.put)

/**
 * @openapi
 * /pages/{pid}:
 *   delete:
 *     summary: "Delete a page."
 *     description: "Delete a page."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The page's unique path or 24-digit hexadecimal ID number."
 *         examples:
 *           pid:
 *             value: "0123456789abcdef12345678"
 *             summary: "The page's unique 24-digit hexadecimal ID number."
 *           path:
 *             value: "/path/to/page"
 *             summary: "The page's unique path."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "The page has been deleted. A representation of the page just prior to its deletion is returned."
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
 *               $ref: "#/components/schemas/Page"
 *       400:
 *         description: "You have provided an invalid path."
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
 *               $ref: "#/components/schemas/InvalidPath"
 *       401:
 *         description: "Only authenticated users can view this page, but you are not authenticated."
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
 *             description: "This header is informing you that you must pass a valid access token as the Bearer header to this request. To obtain a valid access token, see the `POST /tokens` method."
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
 *         description: "You do not have permission to view this page."
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
 *                   example: "You do not have permission to view this page."
 */

router.delete('/:pid', loadUserFromAccessToken, requireValidPath, loadPage, requirePageWrite, trashPage, savePage, item.delete)

// /pages/:pid/revisions

const revisions = {
  options: (req: Request, res: Response) => {
    res.sendStatus(204)
  },
  head: (req: Request, res: Response) => {
    res.sendStatus(200)
  },
  get: (req: Request, res: Response) => {
    res.status(200).send(req.page?.getPublicObj().revisions)
  }
}

router.all('/:pid/revisions', allow(revisions))

/**
 * @openapi
 * /pages/{pid}/revisions:
 *   options:
 *     summary: "Methods for the Revisions collection endpoint."
 *     description: "This method returns an Allow header which lists the methods that this endpoint allows."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The page's unique path or 24-digit hexadecimal ID number."
 *         examples:
 *           pid:
 *             value: "0123456789abcdef12345678"
 *             summary: "The page's unique 24-digit hexadecimal ID number."
 *           path:
 *             value: "/path/to/page"
 *             summary: "The page's unique path."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 */

router.options('/:pid/revisions', loadUserFromAccessToken, requireValidPath, loadPage, requirePageRead, revisions.options)

/**
 * @openapi
 * /pages/{pid}/revisions:
 *   head:
 *     summary: "Return the headers for a page's revisions."
 *     description: "Return the headers for a page's revisions."
 *     tags:
 *       - pages/revisions
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The page's unique path or 24-digit hexadecimal ID number."
 *         examples:
 *           pid:
 *             value: "0123456789abcdef12345678"
 *             summary: "The page's unique 24-digit hexadecimal ID number."
 *           path:
 *             value: "/path/to/page"
 *             summary: "The page's unique path."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *       400:
 *         description: "You have provided an invalid path."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *       401:
 *         description: "Only authenticated users can view this page, but you are not authenticated."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'WWW-Authenticate':
 *             schema:
 *               type: string
 *               example: "Bearer error=\"invalid_token\" error_description=\"The access token could not be verified.\""
 *             description: "This header is informing you that you must pass a valid access token as the Bearer header to this request. To obtain a valid access token, see the `POST /tokens` method."
 *       403:
 *         description: "You do not have permission to view this page."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *
 */

router.head('/:pid/revisions', loadUserFromAccessToken, requireValidPath, loadPage, requirePageRead, revisions.head)

/**
 * @openapi
 * /pages/{pid}:
 *   get:
 *     summary: "Return a page's revisions."
 *     description: "Return a page's revisions."
 *     tags:
 *       - pages
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: "The page's unique path or 24-digit hexadecimal ID number."
 *         examples:
 *           pid:
 *             value: "0123456789abcdef12345678"
 *             summary: "The page's unique 24-digit hexadecimal ID number."
 *           path:
 *             value: "/path/to/page"
 *             summary: "The page's unique path."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Revision"
 *       400:
 *         description: "You have provided an invalid path."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/InvalidPath"
 *       401:
 *         description: "Only authenticated users can view this page, but you are not authenticated."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'WWW-Authenticate':
 *             schema:
 *               type: string
 *               example: "Bearer error=\"invalid_token\" error_description=\"The access token could not be verified.\""
 *             description: "This header is informing you that you must pass a valid access token as the Bearer header to this request. To obtain a valid access token, see the `POST /tokens` method."
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
 *         description: "You do not have permission to view this page."
 *         headers:
 *           'Allow':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS, HEAD, GET"
 *             description: "The methods that this endpoint allows."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "A description of the error that occurred."
 *                   example: "You do not have permission to view this page."
 */

router.get('/:pid/revisions', loadUserFromAccessToken, requireValidPath, loadPage, requirePageRead, revisions.get)

export default router
