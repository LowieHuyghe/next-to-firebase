import * as yargs from 'yargs'
import { run } from './main'

interface Arguments {
  n: string,
  next: string,
  o: string,
  out: string,
  r: string,
  root: string,
  e: string,
  environments: string,
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
  // environments
  .alias('e', 'environments')
  .nargs('e', 1)
  .string('e')
  .describe('e', 'Comma separated environments (ex: development,staging,production)')
  .default('e', '')
  //
  .demandOption(['n', 'o'])
  .help('h')
  .alias('h', 'help')
  .argv

const rootDir = argv.root === 'cwd' ? process.cwd() : argv.root
const relativeNextAppDir = argv.next
const relativeDistDir = argv.out
const environments: string[] = argv.environments
  .split(',')
  .map(environment => environment.trim())
  .filter(environment => environment)

run(rootDir, relativeNextAppDir, relativeDistDir, environments)
