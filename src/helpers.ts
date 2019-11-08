import * as fs from 'fs'
import * as path from 'path'
import * as mkdirp from 'mkdirp'
import * as glob from 'glob'

export const filterEmpty = (item: any): boolean => !!item

export const fillTemplate = (template: string, replace: string, data: string): string => {
  const regex = new RegExp(`([ \\t]*)${replace}`, 'g')
  const match = regex.exec(template)
  if (!match) {
    throw new Error('Did not match anything')
  }
  const spacing = match[1]
  const dataWithSpacing = spacing + data.split('\n').join('\n' + spacing)
  return template.replace(regex, dataWithSpacing)
}

export interface CopyFile {
  source: string
  target: string
}
const copyFile = (file: CopyFile): void => {
  mkdirp.sync(path.dirname(file.target))
  fs.copyFileSync(file.source, file.target)
}

export interface CopyGlob {
  cwd: string
  pattern: string
  targetDir: string
}
const copyGlobToCopyFile = (copyGlob: CopyGlob): CopyFile[] => {
  return glob.sync(copyGlob.pattern, { cwd: copyGlob.cwd, nodir: true })
    .map(file => ({
      source: path.join(copyGlob.cwd, file),
      target: path.join(copyGlob.targetDir, file)
    }))
}

export const copyGlobsAndFiles = (copies: (CopyFile | CopyGlob)[]): void => {
  for (const copy of copies) {
    if ('pattern' in copy) {
      copyGlobToCopyFile(copy).forEach(copyFile)
    } else {
      copyFile(copy)
    }
  }
}
