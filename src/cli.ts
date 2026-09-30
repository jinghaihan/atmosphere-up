import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import { cac } from 'cac'
import { runBuildCommand } from './commands'
import { NAME, VERSION } from './constants'

try {
  const cli: CAC = cac(NAME)

  cli
    .command('[output]', 'Build a core SD card pack for the selected HOS version')
    .option('-o, --output <directory>', 'Parent directory for generated packs')
    .option('--cwd <directory>', 'Working directory for configuration and relative paths')
    .option('--pack', 'Output a ZIP instead of a directory (use --no-pack to override configuration)')
    .action((output: string | undefined, options: CommandOptions) => {
      runBuildCommand({ ...options, output: output ?? options.output }).catch(handleError)
    })

  cli.help()
  cli.version(VERSION)
  cli.parse()
}
catch (error) {
  handleError(error)
}

function handleError(error: unknown): void {
  p.cancel(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
