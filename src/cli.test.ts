import { expect } from 'chai'
import * as path from 'path'
import * as rimraf from 'rimraf'
import * as glob from 'glob'
import { execSync } from 'child_process'

const rootDir = path.resolve(__dirname, '..')
const exampleDir = path.resolve(rootDir, 'example')
const distDir = path.join(exampleDir, 'dist')

describe('cli', () => {
  before(() => {
    execSync('npm run build', { stdio: 'pipe', cwd: rootDir })
  })
  beforeEach(() => {
    rimraf.sync(distDir)
  })
  after(() => {
    rimraf.sync(distDir)
  })

  it('fail', () => {
    expect(() => execSync('./cli.js -r example', { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required arguments: n, o')

    expect(() => execSync('./cli.js -r example -n src/app', { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required argument: o')
    expect(() => execSync('./cli.js -r example --next src/app', { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required argument: o')

    expect(() => execSync('./cli.js -r example -o dist', { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required argument: n')
    expect(() => execSync('./cli.js -r example --out dist', { stdio: 'pipe', cwd: rootDir })).to.throw('Missing required argument: n')
  }).timeout(5000)

  it('run', () => {
    // There should be no dist-folder to start with
    expect(glob.sync('**/*', { cwd: distDir })).to.deep.equal([])

    execSync('./cli.js -r example -n src/app -o dist', { stdio: 'pipe', cwd: rootDir })

    // Check the output
    const contents = glob.sync('**/*', { cwd: distDir })
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
  })
})
