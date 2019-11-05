const fs = require('fs');
const path = require('path');

const filterEmpty = item => !!item;

const getNextInfo = (nextAppDir) => {
  const configPath = path.resolve(nextAppDir, 'next.config.js');
  const config = fs.existsSync(configPath) ? require(configPath) : undefined;

  const publicDir = path.resolve(nextAppDir, 'public');
  const distDir = path.resolve(nextAppDir, (config && config.distDir) || '.next');
  const serverlessPagesDir = path.resolve(distDir, 'serverless/pages');
  const staticDir = path.resolve(distDir, 'static');

  return {
    config,
    publicDir,
    serverlessPagesDir,
    staticDir,
  };
};

const getDistInfo = (rootDir, distDir) => {
  const distDirCopyGlobs = [
    `${rootDir}/firebase.json`,
    `${rootDir}/.firebaserc`,
  ];

  const firebaseJsonSourcePath = path.resolve(rootDir, 'firebase.json');
  const firebaseJsonDistPath = path.resolve(distDir, 'firebase.json');
  const firebaseJson = require(firebaseJsonSourcePath);

  const publicDirCustom = firebaseJson.hosting && firebaseJson.hosting.public;
  const publicSourceDir = path.resolve(rootDir, publicDirCustom || 'public');
  const publicDistDir = path.resolve(distDir, publicDirCustom || 'public');
  const publicNextDistDir = path.resolve(publicDistDir, '_next/static');

  const functionsDirCustom = firebaseJson.functions && firebaseJson.functions.source;
  const functionsSourceDir = path.resolve(rootDir, functionsDirCustom || 'functions');
  const functionsDistDir = path.resolve(distDir, functionsDirCustom || 'functions');
  const functionsIndexDistPath = path.resolve(functionsDistDir, 'index.js');
  const functionsPagesDistDir = path.join(functionsDistDir, 'pages');
  const functionsDistDirCopyGlobs = [
    `${rootDir}/package.json`,
    `${rootDir}/package-lock.json`,
    `${rootDir}/yarn.lock`,
  ];

  return {
    firebaseJsonSourcePath,
    firebaseJsonDistPath,
    distDirCopyGlobs,

    publicSourceDir,
    publicDistDir,
    publicNextDistDir,

    functionsSourceDir,
    functionsDistDir,
    functionsIndexDistPath,
    functionsPagesDistDir,
    functionsDistDirCopyGlobs,
  };
};

const fillTemplate = (template, replace, data) => {
  const regex = new RegExp(`([ \\t]*)${replace}`, 'g');
  const spacing = regex.exec(template)[1];
  const dataWithSpacing = spacing + data.split('\n').join('\n' + spacing);
  return template.replace(regex, dataWithSpacing);
};

module.exports = {
  filterEmpty,
  getNextInfo,
  getDistInfo,
  fillTemplate,
};
