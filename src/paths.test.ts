import { expect } from 'chai'
import * as path from 'path'
import {
  getPaths,
  getGlobsAndFilesToCopy,
  Paths
} from './paths'
import { CopyGlob, CopyFile } from './helpers'
import { manifestToPages } from './pages'

const simpleExampleDir = path.resolve(__dirname, '..', 'examples', 'simple')
const simpleNextAppDir = path.join(simpleExampleDir, 'src/app')
const simpleDistDir = path.join(simpleExampleDir, 'dist')
const withEnvironmentsExampleDir = path.resolve(__dirname, '..', 'examples', 'with-environments')
const withEnvironmentsNextAppDir = path.join(withEnvironmentsExampleDir, 'src/app')
const withEnvironmentsDistDir = path.join(withEnvironmentsExampleDir, 'dist')

describe('paths', () => {
  it('getPaths', () => {
    const paths = getPaths(simpleExampleDir, simpleDistDir, simpleNextAppDir)

    const correct: Paths = {
      rootDir: simpleExampleDir,
      distDir: simpleDistDir,
      next: {
        source: {
          buildDir: path.join(simpleNextAppDir, '.next'),
          publicDir: path.join(simpleNextAppDir, 'public'),
          serverlessDir: path.join(simpleNextAppDir, '.next/serverless'),
          serverlessPagesManifestPath: path.join(simpleNextAppDir, '.next/serverless/pages-manifest.json'),
          staticDir: path.join(simpleNextAppDir, '.next/static')
        }
      },
      firebase: {
        source: {
          jsonPath: path.join(simpleExampleDir, 'firebase.json')
        },
        dist: {
          jsonPath: path.join(simpleDistDir, 'firebase.json')
        }
      },
      functions: {
        source: {
          dir: path.join(simpleExampleDir, 'src/functions')
        },
        dist: {
          dir: path.join(simpleDistDir, 'src/functions'),
          indexPath: path.join(simpleDistDir, 'src/functions/index.js')
        }
      },
      public: {
        source: {
          dir: path.join(simpleExampleDir, 'src/public')
        },
        dist: {
          dir: path.join(simpleDistDir, 'src/public'),
          nextDir: path.join(simpleDistDir, 'src/public/_next/static')
        }
      }
    }
    expect(paths).to.deep.equal(correct)
  })

  it('getPathsWithEnvironments', () => {
    const paths = getPaths(withEnvironmentsExampleDir, withEnvironmentsDistDir, withEnvironmentsNextAppDir)

    const correct: Paths = {
      rootDir: withEnvironmentsExampleDir,
      distDir: withEnvironmentsDistDir,
      next: {
        source: {
          buildDir: path.join(withEnvironmentsNextAppDir, '.next'),
          publicDir: path.join(withEnvironmentsNextAppDir, 'public'),
          serverlessDir: path.join(withEnvironmentsNextAppDir, '.next/serverless'),
          serverlessPagesManifestPath: path.join(withEnvironmentsNextAppDir, '.next/serverless/pages-manifest.json'),
          staticDir: path.join(withEnvironmentsNextAppDir, '.next/static')
        }
      },
      firebase: {
        source: {
          jsonPath: path.join(withEnvironmentsExampleDir, 'firebase.json')
        },
        dist: {
          jsonPath: path.join(withEnvironmentsDistDir, 'firebase.json')
        }
      },
      functions: {
        source: {
          dir: path.join(withEnvironmentsExampleDir, 'src/functions')
        },
        dist: {
          dir: path.join(withEnvironmentsDistDir, 'src/functions'),
          indexPath: path.join(withEnvironmentsDistDir, 'src/functions/index.js')
        }
      },
      public: {
        source: {
          dir: path.join(withEnvironmentsExampleDir, 'src/public')
        },
        dist: {
          dir: path.join(withEnvironmentsDistDir, 'src/public'),
          nextDir: path.join(withEnvironmentsDistDir, 'src/public/_next/static')
        }
      }
    }
    expect(paths).to.deep.equal(correct)
  })

  it('getGlobsAndFilesToCopy', () => {
    const paths = getPaths(simpleExampleDir, simpleDistDir, simpleNextAppDir)
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

  it('getGlobsAndFilesToCopyWithEnvironments', () => {
    const paths = getPaths(withEnvironmentsExampleDir, withEnvironmentsDistDir, withEnvironmentsNextAppDir)
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

  it('getGlobsAndFilesToCopy - No way to handle', () => {
    const paths = getPaths(simpleExampleDir, simpleDistDir, simpleNextAppDir)
    const pages = [{
      key: '/_document',
      path: 'pages/_document.css',
      pathExt: '.css',
      pathNoExt: 'pages/_document',
      absPath: path.join(simpleExampleDir, 'pages/_document.css'),
      special: true
    }]
    expect(() => getGlobsAndFilesToCopy(paths, pages)).to.throw('No way to handle')
  })

  it('getGlobsAndFilesToCopyWithEnvironments - No way to handle', () => {
    const paths = getPaths(withEnvironmentsExampleDir, withEnvironmentsDistDir, withEnvironmentsNextAppDir)
    const pages = [{
      key: '/_document',
      path: 'pages/_document.css',
      pathExt: '.css',
      pathNoExt: 'pages/_document',
      absPath: path.join(withEnvironmentsExampleDir, 'pages/_document.css'),
      special: true
    }]
    expect(() => getGlobsAndFilesToCopy(paths, pages)).to.throw('No way to handle')
  })
})
