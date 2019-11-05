const cpx = require('cpx');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {
  filterEmpty,
  getNextInfo,
  getDistInfo,
  fillTemplate,
} = require('./helpers');
const {
  pagePathToFunctionExport,
  pagePathToFirebaseRewrite,
  sortFirebaseRewrites,
} = require('./pagepath');

const run = (rootDir, relativeNextAppDir, relativeDistDir, logger = console) => {
  const nextAppDir = path.join(rootDir, relativeNextAppDir);
  const distDir = path.join(rootDir, relativeDistDir);
  const nextInfo = getNextInfo(nextAppDir);
  const distInfo = getDistInfo(rootDir, distDir);

  // Prepare
  logger.log('Preparing Run');
  const pagePaths = glob.sync(`**/*`, { cwd: nextInfo.serverlessPagesDir, nodir: true });
  const firebaseJsonRewrites = pagePaths
    .map(pagePathToFirebaseRewrite)
    .filter(filterEmpty)
    .sort(sortFirebaseRewrites)
    .join(',\n');
  const functionExports = pagePaths
    .map(pagePath => pagePathToFunctionExport(pagePath, distInfo.functionsDistDir, distInfo.functionsPagesDistDir))
    .filter(filterEmpty)
    .join('\n');

  // Clean
  rimraf.sync(distDir);

  // Build public
  logger.log('Building public-dir');
  cpx.copySync(`${nextInfo.serverlessPagesDir}/**/*.html`, distInfo.publicDistDir);
  cpx.copySync(`${nextInfo.publicDir}/**/*`, distInfo.publicDistDir);
  cpx.copySync(`${nextInfo.staticDir}/**/*`, distInfo.publicNextDistDir);
  cpx.copySync(`${distInfo.publicSourceDir}/**/*`, distInfo.publicDistDir);

  // Build functions
  logger.log('Building functions-dir');
  cpx.copySync(`${nextInfo.serverlessPagesDir}/**/*.js`, distInfo.functionsPagesDistDir);
  cpx.copySync(`${distInfo.functionsSourceDir}/**/*`, distInfo.functionsDistDir);
  cpx.copySync(distInfo.functionsDistDirCopyGlob, distInfo.functionsDistDir);
  const functionsIndex = fs.readFileSync(distInfo.functionsIndexDistPath).toString();
  fs.writeFileSync(distInfo.functionsIndexDistPath, fillTemplate(functionsIndex, '//_exports_', functionExports));

  // Build firebase
  logger.log('Building dist-dir and firebase');
  cpx.copySync(distInfo.distDirCopyGlob, distDir);
  const firebaseJson = fs.readFileSync(distInfo.firebaseJsonDistPath).toString();
  fs.writeFileSync(distInfo.firebaseJsonDistPath, fillTemplate(firebaseJson, '"_rewrites_"', firebaseJsonRewrites));
};

module.exports = {
  run,
};
