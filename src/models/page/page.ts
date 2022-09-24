import Revision from '../revision/revision.js'
import { isUserData } from '../user/data.js'
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

  addRevision (revision: Revision): void {
    this.revisions = [revision, ...this.revisions]
    this.updated = revision.timestamp
  }

  getRevision (num: number): Revision | null {
    // "num" is 1 for the original version, 2 for the first revision, etc.
    if (num < 1 || num > this.revisions.length) return null
    const chronological = this.revisions.slice().reverse()
    return chronological[num - 1]
  }

  rollback (num: number, editor: User): boolean {
    // "num" is 1 for the original version, 2 for the first revision, etc.
    const target = this.getRevision(num)
    if (target === null) return false
    const rollback = new Revision(Object.assign({}, target.getObj(), {
      editor: editor.getObj(),
      msg: target.msg.length > 0 ? `Rolling back to revision #${num}: ${target.msg}` : `Rolling back to revision #${num}`,
      timestamp: new Date()
    }))
    this.addRevision(rollback)
    return true
  }

  async save (): Promise<void> {
    const data = this.getObj()
    data.revisions.forEach(revision => { if (isUserData(revision.editor)) revision.editor = revision.editor.id })
    if (this.id === undefined) {
      const record = await PageModel.create(data)
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      this.id = record._id?.toString()
    } else {
      await PageModel.findOneAndUpdate({ _id: this.id }, data)
    }
  }

  static async render (text: string): Promise<string> {
    const markup = await renderMarkdown(text)
    return markup
  }
}

export default Page
