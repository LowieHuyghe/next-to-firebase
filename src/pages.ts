import * as path from 'path'
import * as fs from 'fs'

export interface Page {
  key: string
  path: string
  pathExt: string
  pathNoExt: string
  absPath: string
  special: boolean
}
export const manifestToPages = (manifest: { [key: string]: string }, serverlessDir: string, ignoreFileExists: boolean = false): Page[] => Object.keys(manifest)
  // /index should be ignored as / is also present
  .filter(key => key !== '/index')
  .map(key => {
    const pagePath = manifest[key]
    const pagePathExt = path.extname(pagePath)
    return {
      key,
      path: pagePath,
      pathExt: pagePathExt,
      pathNoExt: pagePath.substr(0, pagePath.length - pagePathExt.length),
      absPath: path.join(serverlessDir, pagePath),
      special: /^\/_/.test(key)
    }
  })
  .filter(page => ignoreFileExists || fs.existsSync(page.absPath))

export const sortFirebaseRewrites = (aStr: string, bStr: string): number => {
  const a = JSON.parse(aStr)
  const b = JSON.parse(bStr)

  if (a.source === b.source) return 0
  if (a.source === '**/**') return 1
  if (b.source === '**/**') return -1
  if (a.source > b.source) return 1
  if (a.source < b.source) return -1
  return 0
}

const pageToSource = (page: Page): string => {
  const source = page.key
    .replace(/\[[A-Za-z]+\]/g, '*')

  if (page.special) {
    if (page.key === '/_error') {
      return '**/**'
    }
    throw new Error(`No way to handle "${page.path}"`)
  }

  return source
}

const pageToFunctionName = (page: Page): string => page.pathNoExt
  .split('/')
  .map((part, i) => i === 0 ? part : (part[0].toUpperCase() + part.substr(1)))
  .join('')
  .replace(/[^A-Za-z]/g, '_')

export const pageToDestination = (page: Page): string => {
  if (page.path.indexOf('pages/') === 0) {
    return page.path.split('/').slice(1).join('/')
  }

  throw new Error(`No way to handle "${page.path}"`)
}

export const pageToFunctionExport = (page: Page): string | undefined => {
  if (page.pathExt !== '.js') {
    return undefined
  }

  const functionName = pageToFunctionName(page)

  return `exports.${functionName} = functions.https.onRequest(require('./${page.pathNoExt}').render);`
}

export const pageToFirebaseRewrite = (page: Page): string => {
  if (page.pathExt === '.js') {
    const source = pageToSource(page)
    const functionName = pageToFunctionName(page)
    return JSON.stringify({
      source,
      function: functionName
    })
  }

  if (page.pathExt === '.html') {
    const source = pageToSource(page)
    const destination = pageToDestination(page)
    return JSON.stringify({
      source,
      destination
    })
  }

  throw new Error(`No way to handle "${page.path}"`)
}
