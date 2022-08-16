import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const readFile = (relativePath: string, encoding: BufferEncoding = 'utf8'): string => {
  try {
    const dir = dirname(fileURLToPath(import.meta.url))
    const path = resolve(dir, relativePath)
    return readFileSync(path, { encoding })
  } catch (err) {
    console.error(err)
    return '#ERROR'
  }
}

export default readFile
