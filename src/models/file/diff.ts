import File from './file.js'
import PublicFileData from './public.js'

interface FilesDiff {
  before: PublicFileData | null
  after: PublicFileData | null
}

const diffFiles = (a?: File | null, b?: File | null): FilesDiff => {
  return {
    before: a === undefined || a === null ? null : a.getPublicObj(),
    after: b === undefined || b === null ? null : b.getPublicObj()
  }
}

export default diffFiles
export { FilesDiff }
