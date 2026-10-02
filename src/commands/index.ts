import type { CommandOptions } from '../types'
import * as p from '@clack/prompts'
import c from 'ansis'
import { resolveConfig } from '../config'
import { NAME, VERSION } from '../constants'
import { runBuildCommand } from './build'
import { runUpgradeCommand } from './upgrade'

export * from './build'
export * from './upgrade'

export async function runCommand(options: CommandOptions): Promise<void> {
  p.intro(`${c.yellow`${NAME} `}${c.dim`v${VERSION}`}`)

  const config = await resolveConfig(options)

  switch (config.mode ?? 'build') {
    case 'build':
      await runBuildCommand(config)
      break
    case 'upgrade':
      await runUpgradeCommand(config)
      break
  }
}
