import * as fs from 'fs'
import * as path from 'path'
import {
  CopyFile,
  CopyGlob
} from './helpers'
import { Page, pageToDestination } from './pages'

interface NextPaths {
  source: {
    publicDir: string
    serverlessDir: string
    serverlessPagesManifestPath: string
    staticDir: string
    buildDir: string
  }
}
interface PublicPaths {
  source: {
    dir: string
  }
  dist: {
    dir: string
    nextDir: string
  }
}
interface FirebasePaths {
  source: {
    jsonPath: string
  }
  dist: {
    jsonPath: string
  }
}
interface FunctionsPaths {
  source: {
    dir: string
  }
  dist: {
    dir: string
    indexPath: string
  }
}
export interface Paths {
  rootDir: string
  distDir: string
  next: NextPaths
  firebase: FirebasePaths
  public: PublicPaths
  functions: FunctionsPaths
}

const getNextPaths = (nextAppDir: string): NextPaths => {
  const configPath = path.resolve(nextAppDir, 'next.config.js')
  const config: { distDir?: string } | undefined = fs.existsSync(configPath) ? require(configPath) : undefined

  const publicDir = path.resolve(nextAppDir, 'public')
  const buildDir = path.resolve(nextAppDir, (config && config.distDir) || '.next')
  const serverlessDir = path.resolve(buildDir, 'serverless')
  const serverlessPagesManifestPath = path.resolve(buildDir, 'serverless/pages-manifest.json')
  const staticDir = path.resolve(buildDir, 'static')

  return {
    source: {
      publicDir,
      serverlessDir,
      serverlessPagesManifestPath,
      staticDir,
      buildDir
    }
  }
}

const getFirebasePaths = (rootDir: string, distDir: string): FirebasePaths => {
  const firebaseJsonSourcePath = path.resolve(rootDir, 'firebase.json')
  const firebaseJsonDistPath = path.resolve(distDir, 'firebase.json')

  return {
    source: {
      jsonPath: firebaseJsonSourcePath
    },
    dist: {
      jsonPath: firebaseJsonDistPath
    }
  }
}

const getPublicPaths = (rootDir: string, distDir: string, firebasePaths: FirebasePaths): PublicPaths => {
  const firebaseJson = require(firebasePaths.source.jsonPath)
  let publicDirCustom: string | undefined = undefined
  if (firebaseJson.hosting) {
    if (Array.isArray(firebaseJson.hosting)) {
      // TODO: Handle multiple hostings?
      publicDirCustom = firebaseJson.hosting[0].public
    } else {
      publicDirCustom = firebaseJson.hosting.public
    }
  }

  const publicSourceDir = path.resolve(rootDir, publicDirCustom || 'public')
  const publicDistDir = path.resolve(distDir, publicDirCustom || 'public')
  const publicNextDistDir = path.resolve(publicDistDir, '_next/static')

  return {
    source: {
      dir: publicSourceDir
    },
    dist: {
      dir: publicDistDir,
      nextDir: publicNextDistDir
    }
  }
}

const getFunctionsPaths = (rootDir: string, distDir: string, firebasePaths: FirebasePaths): FunctionsPaths => {
  const firebaseJson = require(firebasePaths.source.jsonPath)
  const functionsDirCustom = firebaseJson.functions && firebaseJson.functions.source

  const functionsSourceDir = path.resolve(rootDir, functionsDirCustom || 'functions')
  const functionsDistDir = path.resolve(distDir, functionsDirCustom || 'functions')
  const functionsIndexDistPath = path.resolve(functionsDistDir, 'index.js')

  return {
    source: {
      dir: functionsSourceDir
    },
    dist: {
      dir: functionsDistDir,
      indexPath: functionsIndexDistPath
    }
  }
}

export const getPaths = (rootDir: string, distDir: string, nextAppDir: string): Paths => {
  const nextPaths = getNextPaths(nextAppDir)
  const firebasePaths = getFirebasePaths(rootDir, distDir)
  const publicPaths = getPublicPaths(rootDir, distDir, firebasePaths)
  const functionsPaths = getFunctionsPaths(rootDir, distDir, firebasePaths)

  return {
    rootDir,
    distDir,
    next: nextPaths,
    firebase: firebasePaths,
    public: publicPaths,
    functions: functionsPaths
  }
}

export const getGlobsAndFilesToCopy = (paths: Paths, pages: Page[]): (CopyFile | CopyGlob)[] => {
  const filesToCopy: CopyFile[] = pages
    .map(page => {
      if (page.pathExt === '.html') {
        return {
          source: page.absPath,
          target: path.join(paths.public.dist.dir, pageToDestination(page))
        }
      }
      if (page.pathExt === '.js') {
        return {
          source: page.absPath,
          target: path.join(paths.functions.dist.dir, page.path)
        }
      }
      throw new Error(`No way to handle "${page.path}"`)
    })

  return [
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
    ...filesToCopy
  ]
}
