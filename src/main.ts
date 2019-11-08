import * as fs from 'fs'
import * as path from 'path'
import * as rimraf from 'rimraf'
import {
  fillTemplate,
  copyGlobsAndFiles
} from './helpers'
import {
  getPaths,
  getGlobsAndFilesToCopy
} from './paths'
import {
  pagesToFunctionExports,
  pagesToFirebaseRewrites,
  manifestToPages
} from './pages'

export const run = (rootDir: string, relativeNextAppDir: string, relativeDistDir: string, logger: Console = console) => {
  const nextAppDir = path.join(rootDir, relativeNextAppDir)
  const distDir = path.join(rootDir, relativeDistDir)

  // Prepare
  logger.log('Preparing Run')
  const paths = getPaths(rootDir, distDir, nextAppDir)
  const manifest: { [key: string]: string } = require(paths.next.source.serverlessPagesManifestPath)
  const pages = manifestToPages(manifest, paths.next.source.serverlessDir)
  const globsAndFilesToCopy = getGlobsAndFilesToCopy(paths, pages)
  const firebaseJsonRewrites = pagesToFirebaseRewrites(pages)
  const functionExports = pagesToFunctionExports(pages)

  // Cleaning up dist-dir
  logger.log('Cleaning up dist-dir')
  rimraf.sync(distDir)

  // Copying everything to dist-dir
  logger.log('Copying everything to dist-dir')
  copyGlobsAndFiles(globsAndFilesToCopy)

  // Building functions-index.js
  logger.log('Building functions-index.js')
  const functionsIndex = fs.readFileSync(paths.functions.dist.indexPath).toString()
  fs.writeFileSync(paths.functions.dist.indexPath, fillTemplate(functionsIndex, '//_exports_', functionExports))

  // Building firebase.json
  logger.log('Building firebase.json')
  const firebaseJson = fs.readFileSync(paths.firebase.dist.jsonPath).toString()
  fs.writeFileSync(paths.firebase.dist.jsonPath, fillTemplate(firebaseJson, '"_rewrites_"', firebaseJsonRewrites))

  // Finished
  logger.log('Finished')
}
