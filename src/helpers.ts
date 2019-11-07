import * as fs from 'fs'
import * as path from 'path'

export const filterEmpty = (item: any): boolean => !!item

export interface NextInfo {
  publicDir: string
  serverlessPagesDir: string
  staticDir: string
  distDir: string
}
export const getNextInfo = (nextAppDir: string): NextInfo => {
  const configPath = path.resolve(nextAppDir, 'next.config.js')
  const config: { distDir?: string } | undefined = fs.existsSync(configPath) ? require(configPath) : undefined

  const publicDir = path.resolve(nextAppDir, 'public')
  const distDir = path.resolve(nextAppDir, (config && config.distDir) || '.next')
  const serverlessPagesDir = path.resolve(distDir, 'serverless/pages')
  const staticDir = path.resolve(distDir, 'static')

  return {
    publicDir,
    serverlessPagesDir,
    staticDir,
    distDir
  }
}

export interface DistInfo {
  firebaseJsonSourcePath: string
  firebaseJsonDistPath: string
  distDirCopyGlobs: string[]

  publicSourceDir: string
  publicDistDir: string
  publicNextDistDir: string
  publicDistDirCopyGlobs: string[]

  functionsSourceDir: string
  functionsDistDir: string
  functionsIndexDistPath: string
  functionsPagesDistDir: string
  functionsDistDirCopyGlobs: string[]
}
export const getDistInfo = (rootDir: string, distDir: string, nextInfo: NextInfo): DistInfo => {
  const distDirCopyGlobs = [
    `${rootDir}/firebase.json`,
    `${rootDir}/.firebaserc`
  ]

  const firebaseJsonSourcePath = path.resolve(rootDir, 'firebase.json')
  const firebaseJsonDistPath = path.resolve(distDir, 'firebase.json')
  const firebaseJson = require(firebaseJsonSourcePath)

  const publicDirCustom = firebaseJson.hosting && firebaseJson.hosting.public
  const publicSourceDir = path.resolve(rootDir, publicDirCustom || 'public')
  const publicDistDir = path.resolve(distDir, publicDirCustom || 'public')
  const publicNextDistDir = path.resolve(publicDistDir, '_next/static')
  const publicDistDirCopyGlobs = [
    `${nextInfo.distDir}/service-worker.js`
  ]

  const functionsDirCustom = firebaseJson.functions && firebaseJson.functions.source
  const functionsSourceDir = path.resolve(rootDir, functionsDirCustom || 'functions')
  const functionsDistDir = path.resolve(distDir, functionsDirCustom || 'functions')
  const functionsIndexDistPath = path.resolve(functionsDistDir, 'index.js')
  const functionsPagesDistDir = path.join(functionsDistDir, 'pages')
  const functionsDistDirCopyGlobs = [
    `${rootDir}/package.json`,
    `${rootDir}/package-lock.json`,
    `${rootDir}/yarn.lock`
  ]

  return {
    firebaseJsonSourcePath,
    firebaseJsonDistPath,
    distDirCopyGlobs,

    publicSourceDir,
    publicDistDir,
    publicNextDistDir,
    publicDistDirCopyGlobs,

    functionsSourceDir,
    functionsDistDir,
    functionsIndexDistPath,
    functionsPagesDistDir,
    functionsDistDirCopyGlobs
  }
}

export const fillTemplate = (template: string, replace: string, data: string): string => {
  const regex = new RegExp(`([ \\t]*)${replace}`, 'g')
  const match = regex.exec(template)
  if (!match) {
    throw new Error('Did not match anything')
  }
  const spacing = match[1]
  const dataWithSpacing = spacing + data.split('\n').join('\n' + spacing)
  return template.replace(regex, dataWithSpacing)
}
