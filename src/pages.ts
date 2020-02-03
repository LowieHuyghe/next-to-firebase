import * as path from 'path'
import * as fs from 'fs'
import { filterEmpty } from './helpers'

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

const sortFirebaseRewrites = (aStr: string, bStr: string): number => {
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
    throw new Error(`No way to handle source "${page.path}"`)
  }

  return source
}

const pageToFunctionName = (page: Page): string => {
  return page.pathNoExt
    .split('/')
    .map((part, i) => i === 0 ? part : (part[0].toUpperCase() + part.substr(1)))
    .join('')
    .replace(/[^A-Za-z]/g, '_')
}

export const pageToDestination = (page: Page): string => {
  if (page.path.indexOf('pages/') === 0) {
    return page.path.split('/').slice(1).join('/')
  }

  throw new Error(`No way to handle destination "${page.path}"`)
}

const pageToFunctionExport = (page: Page, environment: string | undefined): string | undefined => {
  if (page.pathExt !== '.js') {
    return undefined
  }

  const functionName = pageToFunctionName(page)

  if (!environment) {
    return `exports.${functionName} = functions.https.onRequest(require('./${page.pathNoExt}').render);`
  }
  return `${functionName}: functions.https.onRequest(require('./${page.pathNoExt}').render)`
}

const pagesToFunctionExport = (pages: Page[], environment: string | undefined): string | undefined => {
  const functionExports: string[] = []

  for (const page of pages) {
    const functionExport = pageToFunctionExport(page, environment)
    if (functionExport) {
      functionExports.push(functionExport)
    }
  }

  if (!functionExports.length) {
    return undefined
  }
  if (!environment) {
    return functionExports.join('\n')
  }
  return `exports.${environment} = {
  ${functionExports.join(',\n  ')}
};`
}

export const pagesToFunctionExports = (pages: Page[], environments: string[] | undefined): string => {
  const environmentsToUse = (environments && environments.length) ? environments : [undefined]
  const functionExports: string[] = []

  for (const environment of environmentsToUse) {
    const functionExport = pagesToFunctionExport(pages, environment)
    if (functionExport) {
      functionExports.push(functionExport)
    }
  }

  return functionExports.join('\n')
}

const pageToFirebaseRewrite = (page: Page, environment: string | undefined): string => {
  if (page.pathExt === '.js') {
    const source = pageToSource(page)
    let functionName = pageToFunctionName(page)
    if (environment) {
      functionName = `${environment}-${functionName}`
    }
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

  throw new Error(`No way to handle pathExt "${page.path}"`)
}

export const pagesToFirebaseRewrites = (pages: Page[], environments: string[] | undefined): { environment: string | undefined, firebaseRewrites: string }[] => {
  const environmentsToUse = (environments && environments.length) ? environments : [undefined]
  const firebaseRewrites: { environment: string | undefined, firebaseRewrites: string }[] = []

  for (const environment of environmentsToUse) {
    firebaseRewrites.push({
      environment,
      firebaseRewrites: pages
        .map(page => pageToFirebaseRewrite(page, environment))
        .filter(filterEmpty)
        .sort(sortFirebaseRewrites)
        .join(',\n')
    })
  }

  return firebaseRewrites
}
