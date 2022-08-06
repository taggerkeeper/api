import readFile from './read-file.js'

interface NPMPackage {
  [key: string]: string
}

const loadPackage = async (): Promise<NPMPackage | undefined> => {
  try {
    const str = await readFile('../../package.json')
    return JSON.parse(str)
  } catch (err) {
    console.error(err)
  }
}

export default loadPackage
