import { expect } from 'chai'
import * as path from 'path'
import {
  manifestToPages,
  pagesToFunctionExports,
  pagesToFirebaseRewrites,
  Page
} from './pages'

const exampleDir = path.resolve(__dirname, '..', 'example')
const cases: { 0: { [key: string]: string }, 1: Page | undefined }[] = [
  [{ '/_error': 'pages/_error.js' }, {
    key: '/_error',
    path: 'pages/_error.js',
    pathExt: '.js',
    pathNoExt: 'pages/_error',
    absPath: path.join(exampleDir, 'pages/_error.js'),
    special: true
  }],
  [{ '/_document': 'pages/_document.css' }, {
    key: '/_document',
    path: 'pages/_document.css',
    pathExt: '.css',
    pathNoExt: 'pages/_document',
    absPath: path.join(exampleDir, 'pages/_document.css'),
    special: true
  }],
  [{ '/': 'pages/index.js' }, {
    key: '/',
    path: 'pages/index.js',
    pathExt: '.js',
    pathNoExt: 'pages/index',
    absPath: path.join(exampleDir, 'pages/index.js'),
    special: false
  }],
  [{ '/': 'pages/index.html' }, {
    key: '/',
    path: 'pages/index.html',
    pathExt: '.html',
    pathNoExt: 'pages/index',
    absPath: path.join(exampleDir, 'pages/index.html'),
    special: false
  }],
  [{ '/index': 'pages/index.js' }, undefined],
  [{ '/indexx': 'pages/indexx.js' }, {
    key: '/indexx',
    path: 'pages/indexx.js',
    pathExt: '.js',
    pathNoExt: 'pages/indexx',
    absPath: path.join(exampleDir, 'pages/indexx.js'),
    special: false
  }],
  [{ '/index/page': 'pages/index/page.js' }, {
    key: '/index/page',
    path: 'pages/index/page.js',
    pathExt: '.js',
    pathNoExt: 'pages/index/page',
    absPath: path.join(exampleDir, 'pages/index/page.js'),
    special: false
  }],
  [{ '/super/super/deep': 'pages/super/super/deep.js' }, {
    key: '/super/super/deep',
    path: 'pages/super/super/deep.js',
    pathExt: '.js',
    pathNoExt: 'pages/super/super/deep',
    absPath: path.join(exampleDir, 'pages/super/super/deep.js'),
    special: false
  }],
  [{ '/product/[pid]': 'pages/product/[pid].js' }, {
    key: '/product/[pid]',
    path: 'pages/product/[pid].js',
    pathExt: '.js',
    pathNoExt: 'pages/product/[pid]',
    absPath: path.join(exampleDir, 'pages/product/[pid].js'),
    special: false
  }]
]

describe('pages', () => {
  it('manifestToPages', () => {
    for (const casee of cases) {
      const caseePage = manifestToPages(casee[0], exampleDir, true)[0]

      expect(caseePage).to.deep.equal(casee[1])
    }
  })

  it('pagesToFunctionExports', () => {
    const pages: Page[] = cases.map(casee => casee[1]).filter(i => !!i) as Page[]

    const correct = `exports.pages_error = functions.https.onRequest(require('./pages/_error').render);
exports.pagesIndex = functions.https.onRequest(require('./pages/index').render);
exports.pagesIndexx = functions.https.onRequest(require('./pages/indexx').render);
exports.pagesIndexPage = functions.https.onRequest(require('./pages/index/page').render);
exports.pagesSuperSuperDeep = functions.https.onRequest(require('./pages/super/super/deep').render);
exports.pagesProduct_pid_ = functions.https.onRequest(require('./pages/product/[pid]').render);`

    expect(pagesToFunctionExports(pages)).to.equal(correct)
  })

  it('pagesToFirebaseRewrites', () => {
    const pages: Page[] = cases
      .map(casee => casee[1])
      .filter(casee => !!casee && casee.pathExt !== '.css') as Page[]

    const correct = `{"source":"/","function":"pagesIndex"},
{"source":"/","destination":"index.html"},
{"source":"/index/page","function":"pagesIndexPage"},
{"source":"/indexx","function":"pagesIndexx"},
{"source":"/product/*","function":"pagesProduct_pid_"},
{"source":"/super/super/deep","function":"pagesSuperSuperDeep"},
{"source":"**/**","function":"pages_error"}`

    expect(pagesToFirebaseRewrites(pages)).to.equal(correct)
  })
})
