import * as yargs from 'yargs'
import { run } from './main'

interface Arguments {
  n: string,
  next: string,
  o: string,
  out: string,
  r: string,
  root: string,
}
const argv = (yargs as yargs.Argv<Arguments>)
  .usage('Usage: $0 [options]')
  .command('next-to-firebase', 'Next.js + Firebase')
  .example('$0 -n src/app -o dist', '')
  // next
  .alias('n', 'next')
  .nargs('n', 1)
  .string('n')
  .describe('n', 'Next app path relative to project-root')
  // out
  .alias('o', 'out')
  .nargs('o', 1)
  .string('o')
  .describe('o', 'Output directory relative to project-root')
  // root
  .alias('r', 'root')
  .nargs('r', 1)
  .string('r')
  .describe('r', 'Project root')
  .default('r', 'cwd')
  //
  .demandOption(['n', 'o'])
  .help('h')
  .alias('h', 'help')
  .argv

const rootDir = argv.root === 'cwd' ? process.cwd() : argv.root
const relativeNextAppDir = argv.next
const relativeDistDir = argv.out

run(rootDir, relativeNextAppDir, relativeDistDir)
