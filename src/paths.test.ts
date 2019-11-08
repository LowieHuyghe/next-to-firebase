import { expect } from 'chai'
import * as path from 'path'
import {
  getPaths,
  getGlobsAndFilesToCopy,
  Paths
} from './paths'
import { CopyGlob, CopyFile } from './helpers'
import { manifestToPages } from './pages'

const exampleDir = path.resolve(__dirname, '..', 'example')
const nextAppDir = path.join(exampleDir, 'src/app')
const distDir = path.join(exampleDir, 'dist')

describe('paths', () => {
  it('getPaths', () => {
    const paths = getPaths(exampleDir, distDir, nextAppDir)

    const correct: Paths = {
      rootDir: exampleDir,
      distDir,
      next: {
        source: {
          buildDir: path.join(nextAppDir, '.next'),
          publicDir: path.join(nextAppDir, 'public'),
          serverlessDir: path.join(nextAppDir, '.next/serverless'),
          serverlessPagesManifestPath: path.join(nextAppDir, '.next/serverless/pages-manifest.json'),
          staticDir: path.join(nextAppDir, '.next/static')
        }
      },
      firebase: {
        source: {
          jsonPath: path.join(exampleDir, 'firebase.json')
        },
        dist: {
          jsonPath: path.join(distDir, 'firebase.json')
        }
      },
      functions: {
        source: {
          dir: path.join(exampleDir, 'src/functions')
        },
        dist: {
          dir: path.join(distDir, 'src/functions'),
          indexPath: path.join(distDir, 'src/functions/index.js')
        }
      },
      public: {
        source: {
          dir: path.join(exampleDir, 'src/public')
        },
        dist: {
          dir: path.join(distDir, 'src/public'),
          nextDir: path.join(distDir, 'src/public/_next/static')
        }
      }
    }
    expect(paths).to.deep.equal(correct)
  })

  it('getGlobsAndFilesToCopy', () => {
    const paths = getPaths(exampleDir, distDir, nextAppDir)
    const manifest: { [key: string]: string } = require(paths.next.source.serverlessPagesManifestPath)
    const pages = manifestToPages(manifest, paths.next.source.serverlessDir)
    const globsAndFilesToCopy = getGlobsAndFilesToCopy(paths, pages)

    const correct: (CopyFile | CopyGlob)[] = [
      // dist-dir
      { targetDir: paths.distDir, cwd: paths.rootDir, pattern: 'firebase.json' },
      { targetDir: paths.distDir, cwd: paths.rootDir, pattern: '.firebaserc' },

      // public-dist-dir
      { targetDir: paths.public.dist.dir, cwd: paths.next.source.buildDir, pattern: 'service-worker.js' },
      { targetDir: paths.public.dist.dir, cwd: paths.next.source.publicDir, pattern: '**/*' },
      { targetDir: paths.public.dist.nextDir, cwd: paths.next.source.staticDir, pattern: '**/*' },
      { targetDir: paths.public.dist.dir, cwd: paths.public.source.dir, pattern: '**/*' },

      // functions-dist-dir
      { targetDir: paths.functions.dist.dir, cwd: paths.rootDir, pattern: 'package.json' },
      { targetDir: paths.functions.dist.dir, cwd: paths.rootDir, pattern: 'package-lock.json' },
      { targetDir: paths.functions.dist.dir, cwd: paths.rootDir, pattern: 'yarn.json' },
      { targetDir: paths.functions.dist.dir, cwd: paths.functions.source.dir, pattern: '**/*' },

      // pages
      {
        source: path.join(paths.next.source.serverlessDir, 'pages/_error.js'),
        target: path.join(paths.functions.dist.dir, 'pages/_error.js')
      },
      {
        source: path.join(paths.next.source.serverlessDir, 'pages/browser.js'),
        target: path.join(paths.functions.dist.dir, 'pages/browser.js')
      },
      {
        source: path.join(paths.next.source.serverlessDir, 'pages/product/[pid].html'),
        target: path.join(paths.public.dist.dir, 'product/[pid].html')
      },
      {
        source: path.join(paths.next.source.serverlessDir, 'pages/index.html'),
        target: path.join(paths.public.dist.dir, 'index.html')
      }
    ]
    expect(globsAndFilesToCopy).to.deep.equal(correct)
  })
})
