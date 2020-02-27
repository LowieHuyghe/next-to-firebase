import { expect } from 'chai'
import * as path from 'path'
import * as fs from 'fs'
import * as rimraf from 'rimraf'
import * as glob from 'glob'
import { run } from './main'
import { fillTemplate } from './helpers'
import { execSync } from 'child_process'

const relativeNextAppDir = 'src/app'
const relativeDistDir = 'dist'
const simpleExampleDir = path.resolve(__dirname, '..', 'examples', 'simple')
const simpleDistDir = path.join(simpleExampleDir, relativeDistDir)
const withEnvironmentsExampleDir = path.resolve(__dirname, '..', 'examples', 'with-environments')
const withEnvironmentsDistDir = path.join(withEnvironmentsExampleDir, relativeDistDir)

describe('main', () => {
  beforeEach(() => {
    rimraf.sync(simpleDistDir)
    rimraf.sync(withEnvironmentsDistDir)
  })

  it('run', () => {
    // There should be no dist-folder to start with
    expect(glob.sync('**/*', { cwd: simpleDistDir })).to.deep.equal([])

    // Run
    run(simpleExampleDir, relativeNextAppDir, relativeDistDir, undefined)

    // Check the output
    const contents = glob.sync('**/*', { cwd: simpleDistDir })
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
      execSync(`find ${simpleDistDir}`, { stdio: 'inherit' })
      throw e
    }

    // Compare some files explicitly
    const shouldBeEqual: { 0: string, 1: string }[] = [
      [path.join(simpleExampleDir, '.firebaserc'), path.join(simpleDistDir, '.firebaserc')],
      [path.join(simpleExampleDir, 'package.json'), path.join(simpleDistDir, 'src/functions/package.json')],
      [path.join(simpleExampleDir, 'package-lock.json'), path.join(simpleDistDir, 'src/functions/package-lock.json')],
      [path.join(simpleExampleDir, 'src/app/public/robots.txt'), path.join(simpleDistDir, 'src/public/robots.txt')]
    ]
    for (const row of shouldBeEqual) {
      expect(fs.readFileSync(row[0]).toString()).to.equal(fs.readFileSync(row[1]).toString())
    }

    // Firebase.json is a template
    const firebaseJsonRewrites = `{"source":"/","destination":"index.html"},
{"source":"/browser","function":"pagesBrowser"},
{"source":"/product/*","destination":"product/[pid].html"},
{"source":"**/**","function":"pages_error"}`
    const firebaseJsonContent = fillTemplate(fs.readFileSync(path.join(simpleExampleDir, 'firebase.json')).toString(), '"_rewrites_"', firebaseJsonRewrites)
    expect(fs.readFileSync(path.join(simpleDistDir, 'firebase.json')).toString()).to.equal(firebaseJsonContent)

    // Functions index.js is a template
    const functionsIndexExports = `exports.pages_error = functions.https.onRequest(require('./pages/_error').render);
exports.pagesBrowser = functions.https.onRequest(require('./pages/browser').render);`
    const functionsIndexContent = fillTemplate(fs.readFileSync(path.join(simpleExampleDir, 'src/functions/index.js')).toString(), '//_exports_', functionsIndexExports)
    expect(fs.readFileSync(path.join(simpleDistDir, 'src/functions/index.js')).toString()).to.equal(functionsIndexContent)
  })

  it('runWithEnvironments', () => {
    // There should be no dist-folder to start with
    expect(glob.sync('**/*', { cwd: withEnvironmentsDistDir })).to.deep.equal([])

    // Run
    run(withEnvironmentsExampleDir, relativeNextAppDir, relativeDistDir, ['staging', 'production'])

    // Check the output
    const contents = glob.sync('**/*', { cwd: withEnvironmentsDistDir })
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
      execSync(`find ${withEnvironmentsDistDir}`, { stdio: 'inherit' })
      throw e
    }

    // Compare some files explicitly
    const shouldBeEqual: { 0: string, 1: string }[] = [
      [path.join(withEnvironmentsExampleDir, '.firebaserc'), path.join(withEnvironmentsDistDir, '.firebaserc')],
      [path.join(withEnvironmentsExampleDir, 'package.json'), path.join(withEnvironmentsDistDir, 'src/functions/package.json')],
      [path.join(withEnvironmentsExampleDir, 'package-lock.json'), path.join(withEnvironmentsDistDir, 'src/functions/package-lock.json')],
      [path.join(withEnvironmentsExampleDir, 'src/app/public/robots.txt'), path.join(withEnvironmentsDistDir, 'src/public/robots.txt')]
    ]
    for (const row of shouldBeEqual) {
      expect(fs.readFileSync(row[0]).toString()).to.equal(fs.readFileSync(row[1]).toString())
    }

    // Firebase.json is a template
    const firebaseJsonRewrites = [{
      environment: 'staging',
      firebaseRewrites: `{"source":"/","destination":"index.html"},
{"source":"/browser","function":"staging-pagesBrowser"},
{"source":"/product/*","destination":"product/[pid].html"},
{"source":"**/**","function":"staging-pages_error"}`
    }, {
      environment: 'production',
      firebaseRewrites: `{"source":"/","destination":"index.html"},
{"source":"/browser","function":"production-pagesBrowser"},
{"source":"/product/*","destination":"product/[pid].html"},
{"source":"**/**","function":"production-pages_error"}`
    }]
    let firebaseJsonContent = fs.readFileSync(path.join(withEnvironmentsExampleDir, 'firebase.json')).toString()
    for (const firebaseJsonRewrite of firebaseJsonRewrites) {
      firebaseJsonContent = fillTemplate(firebaseJsonContent, `"_${firebaseJsonRewrite.environment}-rewrites_"`, firebaseJsonRewrite.firebaseRewrites)
    }
    expect(fs.readFileSync(path.join(withEnvironmentsDistDir, 'firebase.json')).toString()).to.equal(firebaseJsonContent)

    // Functions index.js is a template
    const functionsIndexExports = `exports.staging = {
  pages_error: functions.https.onRequest(require('./pages/_error').render),
  pagesBrowser: functions.https.onRequest(require('./pages/browser').render)
};
exports.production = {
  pages_error: functions.https.onRequest(require('./pages/_error').render),
  pagesBrowser: functions.https.onRequest(require('./pages/browser').render)
};`
    const functionsIndexContent = fillTemplate(fs.readFileSync(path.join(withEnvironmentsExampleDir, 'src/functions/index.js')).toString(), '//_exports_', functionsIndexExports)
    expect(fs.readFileSync(path.join(withEnvironmentsDistDir, 'src/functions/index.js')).toString()).to.equal(functionsIndexContent)
  })
})
