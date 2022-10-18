import Revision from '../revision/revision.js'
import User from '../user/user.js'
import PageModel from './model.js'
import PageData from './data.js'
import PublicPageData from './public.js'
import renderMarkdown from '../../render/render-markdown.js'
import exists from '../../utils/exists.js'
import getId from '../../utils/get-id.js'

class Page {
  id?: string
  revisions: Revision[]
  created: Date
  updated: Date
  trashed?: Date

  constructor (data?: PageData) {
    this.revisions = data?.revisions === undefined
      ? []
      : data.revisions.map(r => r.constructor.name === 'Revision' ? r as Revision : new Revision(r))
    this.revisions.forEach((revision, index) => { revision.number = this.revisions.length - index })
    this.created = data?.created ?? new Date()
    this.updated = data?.updated ?? new Date()
    if (exists(data?.trashed)) this.trashed = data?.trashed
    const id = getId(data)
    if (id !== null) this.id = id
  }

  getObj (): PageData {
    const obj: PageData = {
      path: this.revisions[0]?.content?.path,
      revisions: this.revisions.map(revision => revision.getObj()),
      created: this.created,
      updated: this.updated
    }
    if (this.trashed !== undefined) obj.trashed = this.trashed
    if (this.id !== undefined) obj.id = this.id
    return obj
  }

  getPublicObj (): PublicPageData {
    const obj: PublicPageData = {
      path: this.revisions[0]?.content?.path,
      revisions: this.revisions.map(revision => revision.getPublicObj()),
      created: this.created,
      updated: this.updated
    }
    if (this.trashed !== undefined) obj.trashed = this.trashed
    if (this.id !== undefined) obj.id = this.id
    return obj
  }

  getCurr (): Revision | null {
    return this.revisions.length > 0 ? this.revisions[0] : null
  }

  addRevision (revision: Revision, inheritFiles = true): void {
    const rev = new Revision(revision.getObj())
    const { file, thumbnail } = this.revisions[0]
    if (inheritFiles && file !== undefined && rev.file === undefined) rev.file = file
    if (inheritFiles && thumbnail !== undefined && rev.thumbnail === undefined) rev.thumbnail = thumbnail
    this.revisions = [rev, ...this.revisions]
    this.updated = rev.timestamp
  }

  getRevision (num: number): Revision | null {
    // "num" is 1 for the original version, 2 for the first revision, etc.
    if (num < 1 || num > this.revisions.length) return null
    const chronological = this.revisions.slice().reverse()
    return chronological[num - 1]
  }

  getRevisionFromStr (num: string): Revision | string {
    const n = parseInt(num)
    if (isNaN(n) || n < 1 || n > this.revisions.length) return `${num} is not a valid number for any revision of this page. Please provide a number between 1 and ${this.revisions.length}.`
    return this.getRevision(n) as Revision
  }

  rollback (revision: Revision, editor?: User): boolean {
    const desc = revision.number === undefined ? 'previous revision' : `revision #${revision.number}`
    const rollback = new Revision(Object.assign({}, revision.getObj(), {
      editor: editor !== undefined ? editor.getObj() : undefined,
      msg: revision.msg.length > 0 ? `Rolling back to ${desc}: ${revision.msg}` : `Rolling back to ${desc}`,
      timestamp: new Date()
    }))
    this.addRevision(rollback)
    return true
  }

  async save (): Promise<void> {
    const data = this.getObj()
    data.revisions.forEach(revision => {
      const id = getId(revision.editor)
      if (id !== null) revision.editor = id
    })

    if (this.id === undefined) {
      const record = await PageModel.create(data)
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      this.id = record._id?.toString()
    } else {
      await PageModel.findOneAndUpdate({ _id: this.id }, data)
    }
  }

  async untrash (): Promise<void> {
    if (this.id !== undefined && this.trashed !== undefined) {
      delete this.trashed
      await PageModel.updateOne({ _id: this.id }, { $unset: { trashed: 1 } })
    }
  }

  static async render (text: string): Promise<string> {
    const markup = await renderMarkdown(text)
    return markup
  }
}

export default Page
