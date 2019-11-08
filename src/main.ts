import * as fs from 'fs'
import * as path from 'path'
import * as rimraf from 'rimraf'
import {
  filterEmpty,
  getNextInfo,
  getDistInfo,
  fillTemplate,
  copyGlob,
  copyGlobs,
  copyFile
} from './helpers'
import {
  pageToFunctionExport,
  pageToFirebaseRewrite,
  sortFirebaseRewrites,
  manifestToPages,
  pageToDestination
} from './pages'

export const run = (rootDir: string, relativeNextAppDir: string, relativeDistDir: string, logger: Console = console) => {
  const nextAppDir = path.join(rootDir, relativeNextAppDir)
  const distDir = path.join(rootDir, relativeDistDir)
  const nextInfo = getNextInfo(nextAppDir)
  const distInfo = getDistInfo(rootDir, distDir, nextInfo)

  // Prepare
  logger.log('Preparing Run')
  const manifest: { [key: string]: string } = require(nextInfo.serverlessPagesManifestPath)
  const pages = manifestToPages(manifest, nextInfo.serverlessDir)
  const firebaseJsonRewrites = pages
    .map(pageToFirebaseRewrite)
    .filter(filterEmpty)
    .sort(sortFirebaseRewrites)
    .join(',\n')
  const functionExports = pages
    .map(page => pageToFunctionExport(page))
    .filter(filterEmpty)
    .join('\n')

  // Clean
  rimraf.sync(distDir)

  // Build public
  logger.log('Building public-dir')
  pages
    .filter(page => page.pathExt === '.html')
    .forEach(page => copyFile(page.absPath, path.join(distInfo.publicDistDir, pageToDestination(page))))
  copyGlob({ cwd: nextInfo.publicDir, pattern: '**/*' }, distInfo.publicDistDir)
  copyGlob({ cwd: nextInfo.staticDir, pattern: '**/*' }, distInfo.publicNextDistDir)
  copyGlob({ cwd: distInfo.publicSourceDir, pattern: '**/*' }, distInfo.publicDistDir)
  copyGlobs(distInfo.publicDistDirCopyGlobs, distInfo.publicDistDir)

  // Build functions
  logger.log('Building functions-dir')
  pages
    .filter(page => page.pathExt === '.js')
    .forEach(page => copyFile(page.absPath, path.join(distInfo.functionsDistDir, page.path)))
  copyGlob({ cwd: distInfo.functionsSourceDir, pattern: '**/*' }, distInfo.functionsDistDir)
  copyGlobs(distInfo.functionsDistDirCopyGlobs, distInfo.functionsDistDir)
  const functionsIndex = fs.readFileSync(distInfo.functionsIndexDistPath).toString()
  fs.writeFileSync(distInfo.functionsIndexDistPath, fillTemplate(functionsIndex, '//_exports_', functionExports))

  // Build firebase
  logger.log('Building dist-dir and firebase')
  copyGlobs(distInfo.distDirCopyGlobs, distDir)
  const firebaseJson = fs.readFileSync(distInfo.firebaseJsonDistPath).toString()
  fs.writeFileSync(distInfo.firebaseJsonDistPath, fillTemplate(firebaseJson, '"_rewrites_"', firebaseJsonRewrites))
}
