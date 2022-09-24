import { Request, Response, Router } from 'express'

import allow from '../middlewares/allow.js'
import loadUserFromAccessToken from '../middlewares/load-user-from-access-token.js'
import searchPages from '../middlewares/search-pages.js'
import addSearchPagination from '../middlewares/add-search-pagination.js'

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
 *             type: object
 *             properties:
 *               content:
 *                 $ref: "#/components/schemas/RevisionContent"
 *               permissions:
 *                 $ref: "#/components/schemas/RevisionPermissions"
 *               editor:
 *                 description: "The user who made this revision."
 *                 $ref: "#/components/schemas/User"
 *               msg:
 *                 type: string
 *                 description: "A message explaining the purpose and intent of the revision."
 *                 example: "Initial text"
 *               timestamp:
 *                 type: number
 *                 description: "The timestamp of when the revision was made (measured as milliseconds since January 1, 1970)."
 *                 example: 1663863528000
 *           created:
 *             type: number
 *             description: "The timestamp of when this page was created (measured as milliseconds since January 1, 1970)."
 *             example: 1663863528000
 *           updated:
 *             type: number
 *             description: "The timestamp of when this page was most recently updated (measured as milliseconds since January 1, 1970)."
 *             example: 1663863528000
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
  }
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
 *               example: "OPTIONS"
 *             description: "The methods that this endpoint allows."
 *           'Access-Control-Allow-Methods':
 *             schema:
 *               type: string
 *               example: "OPTIONS"
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
 *     responses:
 *       200:
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

export default router
