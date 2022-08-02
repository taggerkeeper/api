import checkAll from '../../utils/check-all.js'
import checkAny from '../../utils/check-any.js'
import exists from '../../utils/exists.js'

interface ContentData {
  title: string
  path?: string
  body: string
}

const isContentData = (obj: any): obj is ContentData => {
  if (!exists(obj) || typeof obj !== 'object') return false
  const { title, path, body } = obj
  return checkAll([
    typeof title === 'string',
    checkAny([!exists(path), typeof path === 'string']),
    typeof body === 'string'
  ])
}

export default ContentData
export { isContentData }
