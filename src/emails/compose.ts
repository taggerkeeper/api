import path from 'path'
import readFile from '../utils/read-file.js'
import renderStrVars from '../render/render-str-vars.js'

const composeMail = async (filename: string, data: any): Promise<string> => {
  const template = await readFile(path.resolve(__dirname, filename))
  return renderStrVars(template, data)
}

export default composeMail
