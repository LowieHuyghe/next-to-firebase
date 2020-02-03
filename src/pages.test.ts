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

    expect(pagesToFunctionExports(pages, undefined)).to.equal(correct)
    expect(pagesToFunctionExports(pages, [])).to.equal(correct)
  })

  it('pagesToFunctionExportsWithEnvironments', () => {
    const pages: Page[] = cases.map(casee => casee[1]).filter(i => !!i) as Page[]

    const correct = `exports.development_pages_error = functions.https.onRequest(require('./pages/_error').render);
exports.staging_pages_error = exports.development_pages_error;
exports.production_pages_error = exports.development_pages_error;
exports.development_pagesIndex = functions.https.onRequest(require('./pages/index').render);
exports.staging_pagesIndex = exports.development_pagesIndex;
exports.production_pagesIndex = exports.development_pagesIndex;
exports.development_pagesIndexx = functions.https.onRequest(require('./pages/indexx').render);
exports.staging_pagesIndexx = exports.development_pagesIndexx;
exports.production_pagesIndexx = exports.development_pagesIndexx;
exports.development_pagesIndexPage = functions.https.onRequest(require('./pages/index/page').render);
exports.staging_pagesIndexPage = exports.development_pagesIndexPage;
exports.production_pagesIndexPage = exports.development_pagesIndexPage;
exports.development_pagesSuperSuperDeep = functions.https.onRequest(require('./pages/super/super/deep').render);
exports.staging_pagesSuperSuperDeep = exports.development_pagesSuperSuperDeep;
exports.production_pagesSuperSuperDeep = exports.development_pagesSuperSuperDeep;
exports.development_pagesProduct_pid_ = functions.https.onRequest(require('./pages/product/[pid]').render);
exports.staging_pagesProduct_pid_ = exports.development_pagesProduct_pid_;
exports.production_pagesProduct_pid_ = exports.development_pagesProduct_pid_;`

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
      firebaseRewrites: `{"source":"/","function":"development_pagesIndex"},
{"source":"/","destination":"index.html"},
{"source":"/index/page","function":"development_pagesIndexPage"},
{"source":"/indexx","function":"development_pagesIndexx"},
{"source":"/product/*","function":"development_pagesProduct_pid_"},
{"source":"/super/super/deep","function":"development_pagesSuperSuperDeep"},
{"source":"**/**","function":"development_pages_error"}`
    }, {
      environment: 'staging',
      firebaseRewrites: `{"source":"/","function":"staging_pagesIndex"},
{"source":"/","destination":"index.html"},
{"source":"/index/page","function":"staging_pagesIndexPage"},
{"source":"/indexx","function":"staging_pagesIndexx"},
{"source":"/product/*","function":"staging_pagesProduct_pid_"},
{"source":"/super/super/deep","function":"staging_pagesSuperSuperDeep"},
{"source":"**/**","function":"staging_pages_error"}`
    }, {
      environment: 'production',
      firebaseRewrites: `{"source":"/","function":"production_pagesIndex"},
{"source":"/","destination":"index.html"},
{"source":"/index/page","function":"production_pagesIndexPage"},
{"source":"/indexx","function":"production_pagesIndexx"},
{"source":"/product/*","function":"production_pagesProduct_pid_"},
{"source":"/super/super/deep","function":"production_pagesSuperSuperDeep"},
{"source":"**/**","function":"production_pages_error"}`
    }]

    expect(pagesToFirebaseRewrites(pages, ['development', 'staging', 'production'])).to.deep.equal(correct)
  })

  it('pagesToFirebaseRewrites - No way to handle source', () => {
    const pages: Page[] = [{
      key: '/_document',
      path: 'pages/_document.js',
      pathExt: '.js',
      pathNoExt: 'pages/_document',
      absPath: path.join(exampleDir, 'pages/_document.js'),
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
      absPath: path.join(exampleDir, 'other/index.html'),
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
      absPath: path.join(exampleDir, 'pages/index.css'),
      special: false
    }]

    expect(() => pagesToFirebaseRewrites(pages, undefined)).to.throw('No way to handle pathExt')
    expect(() => pagesToFirebaseRewrites(pages, [])).to.throw('No way to handle pathExt')
    expect(() => pagesToFirebaseRewrites(pages, ['development', 'staging', 'production'])).to.throw('No way to handle pathExt')
  })
})
