import { expect } from 'chai'
import * as path from 'path'
import {
  sortFirebaseRewrites,
  pagePathToFunctionExport,
  pagePathToFirebaseRewrite
} from './pagepath'

const exampleDir = path.resolve(__dirname, '..', 'example')
const functionsDistDir = path.join(exampleDir, 'dist/src/functions')
const functionsPagesDistDir = path.join(functionsDistDir, 'pages')

describe('pagepath', () => {
  it('sortFirebaseRewrites', () => {
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

  it('pagePathToFirebaseRewrite', () => {
    const cases: { 0: string, 1: string | undefined }[] = [
      ['index.js', '{"source":"/","function":"pageIndex"}'],
      ['index.html', '{"source":"/","destination":"index.html"}'],
      ['index.css', undefined],
      ['indexx.js', '{"source":"/indexx","function":"pageIndexx"}'],
      ['indexx.html', '{"source":"/indexx","destination":"indexx.html"}'],
      ['indexx.css', undefined],
      ['index/page.js', '{"source":"/index/page","function":"pageIndexPage"}'],
      ['index/page.html', '{"source":"/index/page","destination":"index/page.html"}'],
      ['index/page.css', undefined],
      ['page/super/deep.js', '{"source":"/page/super/deep","function":"pagePageSuperDeep"}'],
      ['page/super/deep.html', '{"source":"/page/super/deep","destination":"page/super/deep.html"}'],
      ['page/super/deep.css', undefined],
      ['super/super/deep.js', '{"source":"/super/super/deep","function":"pageSuperSuperDeep"}'],
      ['super/super/deep.html', '{"source":"/super/super/deep","destination":"super/super/deep.html"}'],
      ['super/super/deep.css', undefined]
    ]
    for (const casee of cases) {
      if (typeof casee[1] === 'undefined') {
        expect(() => pagePathToFirebaseRewrite(casee[0])).to.throw('No way to handle')
      } else {
        expect(pagePathToFirebaseRewrite(casee[0])).to.equal(casee[1])
      }
    }
  })

  it('pagePathToFunctionExport', () => {
    const cases: { 0: string, 1: undefined | string }[] = [
      ['index.js', 'exports.pageIndex = functions.https.onRequest(require(\'./pages/index\').render);'],
      ['index.html', undefined],
      ['index.css', undefined],
      ['indexx.js', 'exports.pageIndexx = functions.https.onRequest(require(\'./pages/indexx\').render);'],
      ['indexx.html', undefined],
      ['indexx.css', undefined],
      ['index/page.js', 'exports.pageIndexPage = functions.https.onRequest(require(\'./pages/index/page\').render);'],
      ['index/page.html', undefined],
      ['index/page.css', undefined],
      ['page/super/deep.js', 'exports.pagePageSuperDeep = functions.https.onRequest(require(\'./pages/page/super/deep\').render);'],
      ['page/super/deep.html', undefined],
      ['page/super/deep.css', undefined],
      ['super/super/deep.js', 'exports.pageSuperSuperDeep = functions.https.onRequest(require(\'./pages/super/super/deep\').render);'],
      ['super/super/deep.html', undefined],
      ['super/super/deep.css', undefined]
    ]
    for (const casee of cases) {
      expect(pagePathToFunctionExport(casee[0], functionsDistDir, functionsPagesDistDir)).to.equal(casee[1])
    }
  })
})
