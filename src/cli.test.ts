import { expect } from 'chai'
import * as path from 'path'
import * as rimraf from 'rimraf'
import * as glob from 'glob'
import { execSync } from 'child_process'

const rootDir = path.resolve(__dirname, '..')
const simpleExampleRelativeDir = path.join('examples', 'simple')
const simpleExampleDir = path.resolve(rootDir, simpleExampleRelativeDir)
const simpleDistDir = path.join(simpleExampleDir, 'dist')
const withEnvironmentsExampleRelativeDir = path.join('examples', 'with-environments')
const withEnvironmentsExampleDir = path.resolve(rootDir, withEnvironmentsExampleRelativeDir)
const withEnvironmentsDistDir = path.join(withEnvironmentsExampleDir, 'dist')

describe('cli', () => {
  beforeEach(() => {
    rimraf.sync(simpleDistDir)
    rimraf.sync(withEnvironmentsDistDir)
  })

  it('fail', () => {
    expect(() => execSync(`./cli.js -r ${simpleExampleRelativeDir}`, { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required arguments: n, o')

    expect(() => execSync(`./cli.js -r ${simpleExampleRelativeDir} -n src/app`, { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required argument: o')
    expect(() => execSync(`./cli.js -r ${simpleExampleRelativeDir} --next src/app`, { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required argument: o')

    expect(() => execSync(`./cli.js -r ${simpleExampleRelativeDir} -o dist`, { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required argument: n')
    expect(() => execSync(`./cli.js -r ${simpleExampleRelativeDir} --out dist`, { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required argument: n')
  }).timeout(10000)

  it('run', () => {
    // There should be no dist-folder to start with
    expect(glob.sync('**/*', { cwd: simpleDistDir })).to.deep.equal([])

    execSync(`./cli.js -r ${simpleExampleRelativeDir} -n src/app -o dist`, { stdio: 'pipe', cwd: rootDir })

    // Check the output
    const contents = glob.sync('**/*', { cwd: simpleDistDir })
      .filter(item => item.indexOf('src/public/_next/') !== 0)
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
  }).timeout(10000)

  it('runWithEnvironments', () => {
    // There should be no dist-folder to start with
    expect(glob.sync('**/*', { cwd: withEnvironmentsDistDir })).to.deep.equal([])

    execSync(`./cli.js -r ${withEnvironmentsExampleRelativeDir} -n src/app -o dist -e development,staging,production`, { stdio: 'pipe', cwd: rootDir })

    // Check the output
    const contents = glob.sync('**/*', { cwd: withEnvironmentsDistDir })
      .filter(item => item.indexOf('src/public/_next/') !== 0)
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
  }).timeout(10000)
})
