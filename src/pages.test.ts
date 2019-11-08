import { expect } from 'chai'
import * as path from 'path'
import {
  manifestToPages,
  sortFirebaseRewrites,
  pageToFunctionExport,
  pageToFirebaseRewrite,
  Page
} from './pages'

const exampleDir = path.resolve(__dirname, '..', 'example')

describe('pages', () => {
  it('manifestToPages', () => {
    const cases: { 0: { [key: string]: string }, 1: Page | undefined }[] = [
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
      }],
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
      }]
    ]
    for (const casee of cases) {
      const caseePage = manifestToPages(casee[0], exampleDir, true)[0]

      expect(caseePage).to.deep.equal(casee[1])
    }
  })

  it('manifestToPages', () => {
    expect(sortFirebaseRewrites('{ "source": "" }', '{ "source": "" }')).to.equal(0)
    expect(sortFirebaseRewrites('{ "source": "/" }', '{ "source": "/" }')).to.equal(0)

    expect(sortFirebaseRewrites('{ "source": "/page" }', '{ "source": "/" }')).to.equal(1)
    expect(sortFirebaseRewrites('{ "source": "/" }', '{ "source": "/page" }')).to.equal(-1)

    expect(sortFirebaseRewrites('{ "source": "**/**" }', '{ "source": "/" }')).to.equal(1)
    expect(sortFirebaseRewrites('{ "source": "**/**" }', '{ "source": "/*" }')).to.equal(1)
    expect(sortFirebaseRewrites('{ "source": "**/**" }', '{ "source": "/page" }')).to.equal(1)
    expect(sortFirebaseRewrites('{ "source": "/" }', '{ "source": "**/**" }')).to.equal(-1)
    expect(sortFirebaseRewrites('{ "source": "/*" }', '{ "source": "**/**" }')).to.equal(-1)
    expect(sortFirebaseRewrites('{ "source": "/page" }', '{ "source": "**/**" }')).to.equal(-1)
  })

  it('pageToFirebaseRewrite', () => {
    const cases: { 0: { [key: string]: string }, 1: string | undefined }[] = [
      [{ '/': 'pages/index.js' }, '{"source":"/","function":"pagesIndex"}'],
      [{ '/': 'pages/index.html' }, '{"source":"/","destination":"index.html"}'],
      [{ '/': 'pages/index.css' }, undefined],
      [{ '/indexx': 'pages/indexx.js' }, '{"source":"/indexx","function":"pagesIndexx"}'],
      [{ '/indexx': 'pages/indexx.html' }, '{"source":"/indexx","destination":"indexx.html"}'],
      [{ '/indexx': 'pages/indexx.css' }, undefined],
      [{ '/index/page': 'pages/index/page.js' }, '{"source":"/index/page","function":"pagesIndexPage"}'],
      [{ '/index/page': 'pages/index/page.html' }, '{"source":"/index/page","destination":"index/page.html"}'],
      [{ '/index/page': 'pages/index/page.css' }, undefined],
      [{ '/page/super/deep': 'pages/page/super/deep.js' }, '{"source":"/page/super/deep","function":"pagesPageSuperDeep"}'],
      [{ '/page/super/deep': 'pages/page/super/deep.html' }, '{"source":"/page/super/deep","destination":"page/super/deep.html"}'],
      [{ '/page/super/deep': 'pages/page/super/deep.css' }, undefined],
      [{ '/super/super/deep': 'pages/super/super/deep.js' }, '{"source":"/super/super/deep","function":"pagesSuperSuperDeep"}'],
      [{ '/super/super/deep': 'pages/super/super/deep.html' }, '{"source":"/super/super/deep","destination":"super/super/deep.html"}'],
      [{ '/super/super/deep': 'pages/super/super/deep.css' }, undefined],
      [{ '/product/[pid]': 'pages/product/[pid].js' }, '{"source":"/product/*","function":"pagesProduct_pid_"}'],
      [{ '/product/[pid]': 'pages/product/[pid].html' }, '{"source":"/product/*","destination":"product/[pid].html"}'],
      [{ '/product/[pid]': 'pages/product/[pid].css' }, undefined]
    ]
    for (const casee of cases) {
      const caseePage = manifestToPages(casee[0], exampleDir, true)[0]

      if (typeof casee[1] === 'undefined') {
        expect(() => pageToFirebaseRewrite(caseePage)).to.throw('No way to handle')
      } else {
        expect(pageToFirebaseRewrite(caseePage)).to.equal(casee[1])
      }
    }
  })

  it('pageToFunctionExport', () => {
    const cases: { 0: { [key: string]: string }, 1: undefined | string }[] = [
      [{ '/': 'pages/index.js' }, 'exports.pagesIndex = functions.https.onRequest(require(\'./pages/index\').render);'],
      [{ '/': 'pages/index.html' }, undefined],
      [{ '/': 'pages/index.css' }, undefined],
      [{ '/indexx': 'pages/indexx.js' }, 'exports.pagesIndexx = functions.https.onRequest(require(\'./pages/indexx\').render);'],
      [{ '/indexx': 'pages/indexx.html' }, undefined],
      [{ '/indexx': 'pages/indexx.css' }, undefined],
      [{ '/index/page': 'pages/index/page.js' }, 'exports.pagesIndexPage = functions.https.onRequest(require(\'./pages/index/page\').render);'],
      [{ '/index/page': 'pages/index/page.html' }, undefined],
      [{ '/index/page': 'pages/index/page.css' }, undefined],
      [{ '/page/super/deep': 'pages/page/super/deep.js' }, 'exports.pagesPageSuperDeep = functions.https.onRequest(require(\'./pages/page/super/deep\').render);'],
      [{ '/page/super/deep': 'pages/page/super/deep.html' }, undefined],
      [{ '/page/super/deep': 'pages/page/super/deep.css' }, undefined],
      [{ '/super/super/deep': 'pages/super/super/deep.js' }, 'exports.pagesSuperSuperDeep = functions.https.onRequest(require(\'./pages/super/super/deep\').render);'],
      [{ '/super/super/deep': 'pages/super/super/deep.html' }, undefined],
      [{ '/super/super/deep': 'pages/super/super/deep.css' }, undefined],
      [{ '/product/[pid]': 'pages/product/[pid].js' }, 'exports.pagesProduct_pid_ = functions.https.onRequest(require(\'./pages/product/[pid]\').render);'],
      [{ '/product/[pid]': 'pages/product/[pid].html' }, undefined],
      [{ '/product/[pid]': 'pages/product/[pid].css' }, undefined]
    ]
    for (const casee of cases) {
      const caseePage = manifestToPages(casee[0], exampleDir, true)[0]

      expect(pageToFunctionExport(caseePage)).to.equal(casee[1])
    }
  })
})
