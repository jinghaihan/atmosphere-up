import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici'
import { runBuildCommand } from './commands'
import { NAME } from './constants'

try {
  setGlobalDispatcher(new EnvHttpProxyAgent())

  const cli: CAC = cac(NAME)

  cli
    .command('[output]', 'build a core SD card pack for the selected HOS version')
    .option('--cwd <directory>', 'working directory for configuration and relative paths')
    .option('--version <hos>', 'HOS version to build without prompting')
    .option('--output <directory>', 'parent directory for generated packs')
    .option('--ext', 'choose optional extensions after building the core pack')
    .option('--firmware', 'offer firmware download for the selected HOS version')
    .option('--pack', 'output a ZIP instead of a directory')
    .action((output: string | undefined, options: CommandOptions) => {
      runBuildCommand({ ...options, output: output ?? options.output }).catch(handleError)
    })

  cli.help()
  cli.parse()
}
catch (error) {
  handleError(error)
}

function handleError(error: unknown): void {
  p.note(error instanceof Error ? error.message : String(error), c.red('build failed'))
  process.exitCode = 1
}
