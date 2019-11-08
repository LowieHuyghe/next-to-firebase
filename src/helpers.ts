import * as fs from 'fs'
import * as path from 'path'
import * as mkdirp from 'mkdirp'
import * as glob from 'glob'

export const filterEmpty = (item: any): boolean => !!item

export interface NextInfo {
  publicDir: string
  serverlessDir: string
  serverlessPagesManifestPath: string
  staticDir: string
  distDir: string
}
export const getNextInfo = (nextAppDir: string): NextInfo => {
  const configPath = path.resolve(nextAppDir, 'next.config.js')
  const config: { distDir?: string } | undefined = fs.existsSync(configPath) ? require(configPath) : undefined

  const publicDir = path.resolve(nextAppDir, 'public')
  const distDir = path.resolve(nextAppDir, (config && config.distDir) || '.next')
  const serverlessDir = path.resolve(distDir, 'serverless')
  const serverlessPagesManifestPath = path.resolve(distDir, 'serverless/pages-manifest.json')
  const staticDir = path.resolve(distDir, 'static')

  return {
    publicDir,
    serverlessDir,
    serverlessPagesManifestPath,
    staticDir,
    distDir
  }
}

export interface DistInfo {
  firebaseJsonSourcePath: string
  firebaseJsonDistPath: string
  distDirCopyGlobs: GlobPattern[]

  publicSourceDir: string
  publicDistDir: string
  publicNextDistDir: string
  publicDistDirCopyGlobs: GlobPattern[]

  functionsSourceDir: string
  functionsDistDir: string
  functionsIndexDistPath: string
  functionsDistDirCopyGlobs: GlobPattern[]
}
export const getDistInfo = (rootDir: string, distDir: string, nextInfo: NextInfo): DistInfo => {
  const distDirCopyGlobs: GlobPattern[] = [
    { cwd: rootDir, pattern: 'firebase.json' },
    { cwd: rootDir, pattern: '.firebaserc' }
  ]

  const firebaseJsonSourcePath = path.resolve(rootDir, 'firebase.json')
  const firebaseJsonDistPath = path.resolve(distDir, 'firebase.json')
  const firebaseJson = require(firebaseJsonSourcePath)

  const publicDirCustom = firebaseJson.hosting && firebaseJson.hosting.public
  const publicSourceDir = path.resolve(rootDir, publicDirCustom || 'public')
  const publicDistDir = path.resolve(distDir, publicDirCustom || 'public')
  const publicNextDistDir = path.resolve(publicDistDir, '_next/static')
  const publicDistDirCopyGlobs: GlobPattern[] = [
    { cwd: nextInfo.distDir, pattern: 'service-worker.js' }
  ]

  const functionsDirCustom = firebaseJson.functions && firebaseJson.functions.source
  const functionsSourceDir = path.resolve(rootDir, functionsDirCustom || 'functions')
  const functionsDistDir = path.resolve(distDir, functionsDirCustom || 'functions')
  const functionsIndexDistPath = path.resolve(functionsDistDir, 'index.js')
  const functionsDistDirCopyGlobs: GlobPattern[] = [
    { cwd: rootDir, pattern: 'package.json' },
    { cwd: rootDir, pattern: 'package-lock.json' },
    { cwd: rootDir, pattern: 'yarn.json' }
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

export const copyFile = (source: string, target: string): void => {
  mkdirp.sync(path.dirname(target))
  fs.copyFileSync(source, target)
}

export interface GlobPattern {
  cwd: string,
  pattern: string
}
export const copyGlob = (globPattern: GlobPattern, targetDir: string): void => {
  glob.sync(globPattern.pattern, { cwd: globPattern.cwd, nodir: true })
    .forEach(file => copyFile(path.join(globPattern.cwd, file), path.join(targetDir, file)))
}

export const copyGlobs = (globPattern: GlobPattern[], targetDir: string): void => {
  globPattern.forEach(globPattern => copyGlob(globPattern, targetDir))
}
