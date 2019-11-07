import * as fs from 'fs'
import * as path from 'path'
import * as rimraf from 'rimraf'
import * as cpx from 'cpx'
import * as glob from 'glob'
import {
  filterEmpty,
  getNextInfo,
  getDistInfo,
  fillTemplate
} from './helpers'
import {
  pagePathToFunctionExport,
  pagePathToFirebaseRewrite,
  sortFirebaseRewrites
} from './pagepath'

export const run = (rootDir: string, relativeNextAppDir: string, relativeDistDir: string, logger: Console = console) => {
  const nextAppDir = path.join(rootDir, relativeNextAppDir)
  const distDir = path.join(rootDir, relativeDistDir)
  const nextInfo = getNextInfo(nextAppDir)
  const distInfo = getDistInfo(rootDir, distDir, nextInfo)

  // Prepare
  logger.log('Preparing Run')
  const pagePaths = glob.sync(`**/*`, { cwd: nextInfo.serverlessPagesDir, nodir: true })
  const firebaseJsonRewrites = pagePaths
    .map(pagePathToFirebaseRewrite)
    .filter(filterEmpty)
    .sort(sortFirebaseRewrites)
    .join(',\n')
  const functionExports = pagePaths
    .map(pagePath => pagePathToFunctionExport(pagePath, distInfo.functionsDistDir, distInfo.functionsPagesDistDir))
    .filter(filterEmpty)
    .join('\n')

  // Clean
  rimraf.sync(distDir)

  // Build public
  logger.log('Building public-dir')
  cpx.copySync(`${nextInfo.serverlessPagesDir}/**/*.html`, distInfo.publicDistDir)
  cpx.copySync(`${nextInfo.publicDir}/**/*`, distInfo.publicDistDir)
  cpx.copySync(`${nextInfo.staticDir}/**/*`, distInfo.publicNextDistDir)
  cpx.copySync(`${distInfo.publicSourceDir}/**/*`, distInfo.publicDistDir)
  for (const publicDistDirCopyGlob of distInfo.publicDistDirCopyGlobs) {
    cpx.copySync(publicDistDirCopyGlob, distInfo.publicDistDir)
  }

  // Build functions
  logger.log('Building functions-dir')
  cpx.copySync(`${nextInfo.serverlessPagesDir}/**/*.js`, distInfo.functionsPagesDistDir)
  cpx.copySync(`${distInfo.functionsSourceDir}/**/*`, distInfo.functionsDistDir)
  for (const functionsDistDirCopyGlob of distInfo.functionsDistDirCopyGlobs) {
    cpx.copySync(functionsDistDirCopyGlob, distInfo.functionsDistDir)
  }
  const functionsIndex = fs.readFileSync(distInfo.functionsIndexDistPath).toString()
  fs.writeFileSync(distInfo.functionsIndexDistPath, fillTemplate(functionsIndex, '//_exports_', functionExports))

  // Build firebase
  logger.log('Building dist-dir and firebase')
  for (const distDirCopyGlob of distInfo.distDirCopyGlobs) {
    cpx.copySync(distDirCopyGlob, distDir)
  }
  const firebaseJson = fs.readFileSync(distInfo.firebaseJsonDistPath).toString()
  fs.writeFileSync(distInfo.firebaseJsonDistPath, fillTemplate(firebaseJson, '"_rewrites_"', firebaseJsonRewrites))
}
