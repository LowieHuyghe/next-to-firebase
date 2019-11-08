import { expect } from 'chai'
import * as path from 'path'
import {
  filterEmpty,
  getNextInfo,
  getDistInfo,
  fillTemplate,
  NextInfo,
  DistInfo
} from './helpers'

const exampleDir = path.resolve(__dirname, '..', 'example')
const nextAppDir = path.join(exampleDir, 'src/app')
const distDir = path.join(exampleDir, 'dist')

describe('helpers', () => {
  it('filterEmpty', () => {
    expect(filterEmpty(true)).to.equal(true)
    expect(filterEmpty(false)).to.equal(false)

    expect(filterEmpty('')).to.equal(false)
    expect(filterEmpty('i')).to.equal(true)

    expect(filterEmpty(0)).to.equal(false)
    expect(filterEmpty(1)).to.equal(true)

    expect(filterEmpty(undefined)).to.equal(false)
    expect(filterEmpty(null)).to.equal(false)
    expect(filterEmpty({})).to.equal(true)
  })

  it('fillTemplate', () => {
    const template = `{
  "hosting": {
    "rewrites": [
      { source: "/page", destination: "page.html" },
      "_rewrites_"
    ]
  }
}`
    const data = `{ source: "/", destination: "index.html" },
{ source: "**/**", function: "_error" }`

    const result = fillTemplate(template, '"_rewrites_"', data)

    expect(result).to.equal(`{
  "hosting": {
    "rewrites": [
      { source: "/page", destination: "page.html" },
      { source: "/", destination: "index.html" },
      { source: "**/**", function: "_error" }
    ]
  }
}`)
  })

  it('getNextInfo', () => {
    const nextInfo = getNextInfo(nextAppDir)

    const correct: NextInfo = {
      distDir: path.join(nextAppDir, '.next'),
      publicDir: path.join(nextAppDir, 'public'),
      serverlessDir: path.join(nextAppDir, '.next/serverless'),
      serverlessPagesManifestPath: path.join(nextAppDir, '.next/serverless/pages-manifest.json'),
      staticDir: path.join(nextAppDir, '.next/static')
    }
    expect(nextInfo).to.deep.equal(correct)
  })

  it('getDistInfo', () => {
    const nextInfo = getNextInfo(nextAppDir)
    const distInfo = getDistInfo(exampleDir, distDir, nextInfo)

    const correct: DistInfo = {
      distDirCopyGlobs: [
        path.join(exampleDir, 'firebase.json'),
        path.join(exampleDir, '.firebaserc')
      ],
      firebaseJsonDistPath: path.join(distDir, 'firebase.json'),
      firebaseJsonSourcePath: path.join(exampleDir, 'firebase.json'),
      functionsDistDir: path.join(distDir, 'src/functions'),
      functionsDistDirCopyGlobs: [
        path.join(exampleDir, 'package.json'),
        path.join(exampleDir, 'package-lock.json'),
        path.join(exampleDir, 'yarn.lock')
      ],
      functionsIndexDistPath: path.join(distDir, 'src/functions/index.js'),
      functionsSourceDir: path.join(exampleDir, 'src/functions'),
      publicDistDir: path.join(distDir, 'src/public'),
      publicDistDirCopyGlobs: [
        path.join(nextInfo.distDir, 'service-worker.js')
      ],
      publicNextDistDir: path.join(distDir, 'src/public/_next/static'),
      publicSourceDir: path.join(exampleDir, 'src/public')
    }
    expect(distInfo).to.deep.equal(correct)
  })
})
