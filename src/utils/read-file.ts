import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const readFile = async (relativePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> => {
  try {
    const dir = dirname(fileURLToPath(import.meta.url))
    const path = resolve(dir, relativePath)
    const content = await readFileSync(path, { encoding })
    return content
  } catch (err) {
    console.error(err)
    return '#ERROR'
  }
}

export default readFile
