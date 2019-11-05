const path = require('path');

const sortFirebaseRewrites = (aStr, bStr) => {
  const a = JSON.parse(aStr);
  const b= JSON.parse(bStr);

  if (a.source === b.source) return 0;
  if (a.source === '**/**') return 1;
  if (b.source === '**/**') return -1;
  if (a.source > b.source) return 1;
  if (a.source < b.source) return -1;
  return 0;
};

const isPagePathSpecial = pagePath => /^_/.test(pagePath);

const pagePathToNoExt = pagePath => {
  const pagePathExt = path.extname(pagePath);
  return pagePath.substr(0, pagePath.length - pagePathExt.length);
};

const pagePathToSource = pagePath => {
  const pagePathNoExt = pagePathToNoExt(pagePath);
  const source = '/' + pagePathNoExt
    .replace(/\[[A-Za-z]+\]/g, '*')
    .replace(/^index$/g, '');

  if (isPagePathSpecial(pagePath)) {
    if (pagePath === '_error.js') {
      return '**/**';
    }
    throw new Error(`No way to handle "${pagePath}"`);
  }

  return source;
};

const pagePathToFunctionName = pagePath => 'page' + pagePathToNoExt(pagePath)
    .split('/')
    .map(part => part[0].toUpperCase() + part.substr(1))
    .join('')
    .replace(/[^A-Za-z]/g, '_');

const pagePathToFunctionExport = (pagePath, functionsDistDir, functionsPagesDistDir) => {
  const pagePathExt = path.extname(pagePath);
  if (pagePathExt !== '.js') {
    return undefined;
  }

  const pagePathNoExt = pagePathToNoExt(pagePath);
  const functionName = pagePathToFunctionName(pagePath);
  const relPath = path.relative(functionsDistDir, functionsPagesDistDir);

  return `exports.${functionName} = functions.https.onRequest(require('./${path.join(relPath, pagePathNoExt)}').render);`;
};

const pagePathToFirebaseRewrite = pagePath => {
  const pagePathExt = path.extname(pagePath);

  if (pagePathExt === '.js') {
    const source = pagePathToSource(pagePath);
    const functionName = pagePathToFunctionName(pagePath);
    return JSON.stringify({
      source,
      function: functionName,
    });
  }

  if (pagePathExt === '.html') {
    const source = pagePathToSource(pagePath);
    return JSON.stringify({
      source,
      destination: pagePath,
    });
  }

  throw new Error(`No way to handle "${pagePath}"`);
};

module.exports = {
  pagePathToFunctionExport,
  pagePathToFirebaseRewrite,
  sortFirebaseRewrites,
};
