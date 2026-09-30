import type { CommandOptions } from '../types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { resolveConfig } from '../config'
import { NAME, VERSION } from '../constants'
import { buildPack, getBundles, inspectOutput, resolveResources } from '../core'
import { getOutputPath } from '../utils'

export async function runBuildCommand(options: CommandOptions): Promise<void> {
  p.intro(`${c.yellow`${NAME} `}${c.dim`v${VERSION}`}`)
  const config = await resolveConfig(options)
  const bundles = getBundles()
  const bundle = await p.select({
    message: 'select HOS version',
    options: bundles.map(bundle => ({ value: bundle, label: bundle.labels.hos, hint: `Atmosphere ${bundle.labels.atmosphere}` })),
    initialValue: bundles[0],
  })
  if (p.isCancel(bundle)) {
    p.cancel('aborting')
    return
  }

  const cwd = config.cwd || process.cwd()
  const destination = getOutputPath(bundle, config.output || cwd, config.pack)
  const replace = inspectOutput(destination, cwd)
  if (replace) {
    const confirmed = await p.confirm({
      message: `output already exists: ${destination}. replace it?`,
      initialValue: false,
    })
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('aborting')
      return
    }
  }

  const controller = new AbortController()
  const spinner = p.spinner({ onCancel: () => controller.abort(), cancelMessage: 'cancelling build' })
  const task = { signal: controller.signal, onProgress: (message: string) => spinner.message(message) }
  spinner.start('resolving core releases')
  // Let Ctrl+C emit SIGINT instead of Clack's keypress blocker exiting immediately.
  if (process.stdin.isTTY)
    process.stdin.setRawMode(false)
  try {
    const resources = await resolveResources(bundle, task)
    await buildPack(bundle, resources, destination, replace, config.pack, task)
    spinner.stop('core pack assembled')
  }
  catch (error) {
    if (controller.signal.aborted) {
      p.cancel('build cancelled; temporary files removed')
      process.exitCode = 130
      return
    }
    spinner.error('build failed')
    throw error
  }
  p.outro(`pack ready: ${destination}`)
}
