import type { CAC } from 'cac'
import type { CommandOptions, Mode } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici'
import { runCommand } from './commands'
import { NAME } from './constants'

try {
  setGlobalDispatcher(new EnvHttpProxyAgent())

  const cli: CAC = cac(NAME)

  cli
    .command('[mode] [...modules]', 'build an SD card pack or upgrade selected modules')
    .option('--cwd <directory>', 'working directory for configuration and relative paths')
    .option('--version <hos>', 'HOS version to use without prompting')
    .option('--output <directory>', 'parent directory for generated packs')
    .option('--ext', 'choose optional modules after building the core pack')
    .option('--firmware', 'offer firmware download for the selected HOS version')
    .option('--pack', 'output a ZIP instead of a directory')
    .example('npx atmosphere-up build')
    .example('npx atmosphere-up upgrade dbi jksv')
    .action((mode: Mode | undefined, modules: string[], options: CommandOptions) => {
      runCommand({ ...options, mode, modules: modules.length ? modules : undefined }).catch(handleError)
    })

  cli.help()
  cli.parse()
}
catch (error) {
  handleError(error)
}

function handleError(error: unknown): void {
  p.note(error instanceof Error ? error.message : String(error), c.red('command failed'))
  process.exitCode = 1
}
