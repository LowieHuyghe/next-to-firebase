import { expect } from 'chai'
import * as path from 'path'
import {
  manifestToPages,
  pagesToFunctionExports,
  pagesToFirebaseRewrites,
  Page
} from './pages'

const simpleExampleDir = path.resolve(__dirname, '..', 'examples', 'simple')
const cases: { 0: { [key: string]: string }, 1: Page | undefined }[] = [
  [{ '/_error': 'pages/_error.js' }, {
    key: '/_error',
    path: 'pages/_error.js',
    pathExt: '.js',
    pathNoExt: 'pages/_error',
    absPath: path.join(simpleExampleDir, 'pages/_error.js'),
    special: true
  }],
  [{ '/': 'pages/index.js' }, {
    key: '/',
    path: 'pages/index.js',
    pathExt: '.js',
    pathNoExt: 'pages/index',
    absPath: path.join(simpleExampleDir, 'pages/index.js'),
    special: false
  }],
  [{ '/': 'pages/index.html' }, {
    key: '/',
    path: 'pages/index.html',
    pathExt: '.html',
    pathNoExt: 'pages/index',
    absPath: path.join(simpleExampleDir, 'pages/index.html'),
    special: false
  }],
  [{ '/index': 'pages/index.js' }, undefined],
  [{ '/indexx': 'pages/indexx.js' }, {
    key: '/indexx',
    path: 'pages/indexx.js',
    pathExt: '.js',
    pathNoExt: 'pages/indexx',
    absPath: path.join(simpleExampleDir, 'pages/indexx.js'),
    special: false
  }],
  [{ '/index/page': 'pages/index/page.js' }, {
    key: '/index/page',
    path: 'pages/index/page.js',
    pathExt: '.js',
    pathNoExt: 'pages/index/page',
    absPath: path.join(simpleExampleDir, 'pages/index/page.js'),
    special: false
  }],
  [{ '/super/super/deep': 'pages/super/super/deep.js' }, {
    key: '/super/super/deep',
    path: 'pages/super/super/deep.js',
    pathExt: '.js',
    pathNoExt: 'pages/super/super/deep',
    absPath: path.join(simpleExampleDir, 'pages/super/super/deep.js'),
    special: false
  }],
  [{ '/product/[pid]': 'pages/product/[pid].js' }, {
    key: '/product/[pid]',
    path: 'pages/product/[pid].js',
    pathExt: '.js',
    pathNoExt: 'pages/product/[pid]',
    absPath: path.join(simpleExampleDir, 'pages/product/[pid].js'),
    special: false
  }]
]

describe('pages', () => {
  it('manifestToPages', () => {
    for (const casee of cases) {
      const caseePage = manifestToPages(casee[0], simpleExampleDir, true)[0]

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

    expect(pagesToFunctionExports(pages, undefined)).to.equal(correct)
    expect(pagesToFunctionExports(pages, [])).to.equal(correct)
  })

  it('pagesToFunctionExportsWithEnvironments', () => {
    const pages: Page[] = cases.map(casee => casee[1]).filter(i => !!i) as Page[]

    const correct = `exports.development = {
  pages_error: functions.https.onRequest(require('./pages/_error').render),
  pagesIndex: functions.https.onRequest(require('./pages/index').render),
  pagesIndexx: functions.https.onRequest(require('./pages/indexx').render),
  pagesIndexPage: functions.https.onRequest(require('./pages/index/page').render),
  pagesSuperSuperDeep: functions.https.onRequest(require('./pages/super/super/deep').render),
  pagesProduct_pid_: functions.https.onRequest(require('./pages/product/[pid]').render)
};
exports.staging = {
  pages_error: functions.https.onRequest(require('./pages/_error').render),
  pagesIndex: functions.https.onRequest(require('./pages/index').render),
  pagesIndexx: functions.https.onRequest(require('./pages/indexx').render),
  pagesIndexPage: functions.https.onRequest(require('./pages/index/page').render),
  pagesSuperSuperDeep: functions.https.onRequest(require('./pages/super/super/deep').render),
  pagesProduct_pid_: functions.https.onRequest(require('./pages/product/[pid]').render)
};
exports.production = {
  pages_error: functions.https.onRequest(require('./pages/_error').render),
  pagesIndex: functions.https.onRequest(require('./pages/index').render),
  pagesIndexx: functions.https.onRequest(require('./pages/indexx').render),
  pagesIndexPage: functions.https.onRequest(require('./pages/index/page').render),
  pagesSuperSuperDeep: functions.https.onRequest(require('./pages/super/super/deep').render),
  pagesProduct_pid_: functions.https.onRequest(require('./pages/product/[pid]').render)
};`

    expect(pagesToFunctionExports(pages, ['development', 'staging', 'production'])).to.equal(correct)
  })

  it('pagesToFirebaseRewrites', () => {
    const pages: Page[] = cases
      .map(casee => casee[1])
      .filter(casee => !!casee && casee.key !== '/_document') as Page[]

    const correct = [{
      environment: undefined,
      firebaseRewrites: `{"source":"/","function":"pagesIndex"},
{"source":"/","destination":"index.html"},
{"source":"/index/page","function":"pagesIndexPage"},
{"source":"/indexx","function":"pagesIndexx"},
{"source":"/product/*","function":"pagesProduct_pid_"},
{"source":"/super/super/deep","function":"pagesSuperSuperDeep"},
{"source":"**/**","function":"pages_error"}`
    }]

    expect(pagesToFirebaseRewrites(pages, undefined)).to.deep.equal(correct)
    expect(pagesToFirebaseRewrites(pages, [])).to.deep.equal(correct)
  })

  it('pagesToFirebaseRewritesWithEnvironments', () => {
    const pages: Page[] = cases
      .map(casee => casee[1])
      .filter(casee => !!casee && casee.key !== '/_document') as Page[]

    const correct = [{
      environment: 'development',
      firebaseRewrites: `{"source":"/","function":"development-pagesIndex"},
{"source":"/","destination":"index.html"},
{"source":"/index/page","function":"development-pagesIndexPage"},
{"source":"/indexx","function":"development-pagesIndexx"},
{"source":"/product/*","function":"development-pagesProduct_pid_"},
{"source":"/super/super/deep","function":"development-pagesSuperSuperDeep"},
{"source":"**/**","function":"development-pages_error"}`
    }, {
      environment: 'staging',
      firebaseRewrites: `{"source":"/","function":"staging-pagesIndex"},
{"source":"/","destination":"index.html"},
{"source":"/index/page","function":"staging-pagesIndexPage"},
{"source":"/indexx","function":"staging-pagesIndexx"},
{"source":"/product/*","function":"staging-pagesProduct_pid_"},
{"source":"/super/super/deep","function":"staging-pagesSuperSuperDeep"},
{"source":"**/**","function":"staging-pages_error"}`
    }, {
      environment: 'production',
      firebaseRewrites: `{"source":"/","function":"production-pagesIndex"},
{"source":"/","destination":"index.html"},
{"source":"/index/page","function":"production-pagesIndexPage"},
{"source":"/indexx","function":"production-pagesIndexx"},
{"source":"/product/*","function":"production-pagesProduct_pid_"},
{"source":"/super/super/deep","function":"production-pagesSuperSuperDeep"},
{"source":"**/**","function":"production-pages_error"}`
    }]

    expect(pagesToFirebaseRewrites(pages, ['development', 'staging', 'production'])).to.deep.equal(correct)
  })

  it('pagesToFirebaseRewrites - No way to handle source', () => {
    const pages: Page[] = [{
      key: '/_document',
      path: 'pages/_document.js',
      pathExt: '.js',
      pathNoExt: 'pages/_document',
      absPath: path.join(simpleExampleDir, 'pages/_document.js'),
      special: true
    }]

    expect(() => pagesToFirebaseRewrites(pages, undefined)).to.throw('No way to handle source')
    expect(() => pagesToFirebaseRewrites(pages, [])).to.throw('No way to handle source')
    expect(() => pagesToFirebaseRewrites(pages, ['development', 'staging', 'production'])).to.throw('No way to handle source')
  })

  it('pagesToFirebaseRewrites - No way to handle destination', () => {
    const pages: Page[] = [{
      key: '/index',
      path: 'other/index.html',
      pathExt: '.html',
      pathNoExt: 'other/index',
      absPath: path.join(simpleExampleDir, 'other/index.html'),
      special: false
    }]

    expect(() => pagesToFirebaseRewrites(pages, undefined)).to.throw('No way to handle destination')
    expect(() => pagesToFirebaseRewrites(pages, [])).to.throw('No way to handle destination')
    expect(() => pagesToFirebaseRewrites(pages, ['development', 'staging', 'production'])).to.throw('No way to handle destination')
  })

  it('pagesToFirebaseRewrites - No way to handle pathExt', () => {
    const pages: Page[] = [{
      key: '/index',
      path: 'pages/index.css',
      pathExt: '.css',
      pathNoExt: 'pages/index',
      absPath: path.join(simpleExampleDir, 'pages/index.css'),
      special: false
    }]

    expect(() => pagesToFirebaseRewrites(pages, undefined)).to.throw('No way to handle pathExt')
    expect(() => pagesToFirebaseRewrites(pages, [])).to.throw('No way to handle pathExt')
    expect(() => pagesToFirebaseRewrites(pages, ['development', 'staging', 'production'])).to.throw('No way to handle pathExt')
  })
})
