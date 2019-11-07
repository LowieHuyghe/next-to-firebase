import { expect } from 'chai'
import * as path from 'path'
import * as fs from 'fs'
import * as rimraf from 'rimraf'
import * as glob from 'glob'
import { run } from './main'
import { fillTemplate } from './helpers'
import { execSync } from 'child_process'

const exampleDir = path.resolve(__dirname, '..', 'example')
const relativeNextAppDir = 'src/app'
const relativeDistDir = 'dist'
const distDir = path.join(exampleDir, 'dist')

describe('main', () => {
  beforeEach(() => {
    rimraf.sync(distDir)
  })
  after(() => {
    rimraf.sync(distDir)
  })

  it('run', () => {
    // There should be no dist-folder to start with
    expect(glob.sync('**/*', { cwd: distDir })).to.deep.equal([])

    // Run
    run(exampleDir, relativeNextAppDir, relativeDistDir)

    // Check the output
    const contents = glob.sync('**/*', { cwd: distDir })
      .filter(item => item.indexOf('src/public/_next/') !== 0)
    try {
      expect(contents).to.deep.equal([
        // root
        'firebase.json',
        'src',
        // functions
        'src/functions',
        'src/functions/index.js',
        'src/functions/package-lock.json',
        'src/functions/package.json',
        'src/functions/pages',
        'src/functions/pages/_error.js',
        'src/functions/pages/browser.js',
        // public
        'src/public',
        'src/public/_next',
        'src/public/index.html',
        'src/public/product',
        'src/public/product/[pid].html',
        'src/public/robots.txt'
      ])
    } catch (e) {
      execSync(`find ${distDir}`, { stdio: 'inherit' })
      throw e
    }

    // Compare some files explicitly
    const shouldBeEqual: { 0: string, 1: string }[] = [
      [path.join(exampleDir, '.firebaserc'), path.join(distDir, '.firebaserc')],
      [path.join(exampleDir, 'package.json'), path.join(distDir, 'src/functions/package.json')],
      [path.join(exampleDir, 'package-lock.json'), path.join(distDir, 'src/functions/package-lock.json')],
      [path.join(exampleDir, 'src/app/public/robots.txt'), path.join(distDir, 'src/public/robots.txt')]
    ]
    for (const row of shouldBeEqual) {
      expect(fs.readFileSync(row[0]).toString()).to.equal(fs.readFileSync(row[1]).toString())
    }

    // Firebase.json is a template
    const firebaseJsonRewrites = `{"source":"/","destination":"index.html"},
{"source":"/browser","function":"pageBrowser"},
{"source":"/product/*","destination":"product/[pid].html"},
{"source":"**/**","function":"page_error"}`
    const firebaseJsonContent = fillTemplate(fs.readFileSync(path.join(exampleDir, 'firebase.json')).toString(), '"_rewrites_"', firebaseJsonRewrites)
    expect(fs.readFileSync(path.join(distDir, 'firebase.json')).toString()).to.equal(firebaseJsonContent)

    // Functions index.js is a template
    const functionsIndexExports = `exports.page_error = functions.https.onRequest(require('./pages/_error').render);
exports.pageBrowser = functions.https.onRequest(require('./pages/browser').render);`
    const functionsIndexContent = fillTemplate(fs.readFileSync(path.join(exampleDir, 'src/functions/index.js')).toString(), '//_exports_', functionsIndexExports)
    expect(fs.readFileSync(path.join(distDir, 'src/functions/index.js')).toString()).to.equal(functionsIndexContent)
  })
})
