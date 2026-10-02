import type { Options } from '../types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import tildify from 'tildify'
import { buildPack, resolveResources } from '../core'
import { promptExtensions, resolveExtensions } from '../extensions'
import { promptFirmware, resolveFirmware } from '../firmware'
import { getOutputPath } from '../utils'
import { confirmOutput, promptBundle } from './shared'

export async function runBuildCommand(config: Options): Promise<void> {
  const bundle = await promptBundle(config.version)

  if (p.isCancel(bundle)) {
    p.cancel('aborting')
    return
  }

  const cwd = config.cwd || process.cwd()
  const destination = getOutputPath(bundle, config.output || cwd, config.pack)
  const replace = await confirmOutput(destination, cwd)

  if (replace === undefined)
    return

  const controller = new AbortController()
  const spinner = p.spinner({
    onCancel: () => controller.abort(),
    cancelMessage: 'cancelling build',
  })

  const task = {
    signal: controller.signal,
    onProgress: (message: string) => spinner.message(c.cyan(message)),
  }

  spinner.start(c.cyan('resolving core releases'))
  // Let Ctrl+C emit SIGINT instead of Clack's keypress blocker exiting immediately.
  if (process.stdin.isTTY)
    process.stdin.setRawMode(false)

  try {
    const resources = await resolveResources(bundle, task)

    await buildPack({
      ...task,
      bundle,
      resources,
      directory: destination,
      replace,
      pack: config.pack,
      onCoreReady: config.ext
        ? async () => {
          spinner.stop(c.green('core modules assembled'))

          const selection = await promptExtensions(controller)

          spinner.start(c.cyan('finalizing pack'))
          if (process.stdin.isTTY)
            process.stdin.setRawMode(false)

          return resolveExtensions(selection, {
            ...task,
            hos: bundle.labels.hos,
          })
        }
        : undefined,
      onExtensionsReady: config.firmware
        ? async () => {
          spinner.stop(c.green(config.ext ? 'optional modules assembled' : 'core modules assembled'))

          const enabled = await promptFirmware(controller, bundle.labels.hos)

          spinner.start(c.cyan(enabled ? 'resolving firmware' : 'finalizing pack'))
          if (process.stdin.isTTY)
            process.stdin.setRawMode(false)

          return enabled ? [await resolveFirmware(bundle.labels.hos, task)] : []
        }
        : undefined,
    })

    spinner.stop(c.green('pack assembled'))
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

  p.outro(`${c.green('pack ready:')} ${c.cyan(tildify(destination))}`)
}
