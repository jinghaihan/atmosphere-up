import type { Bundle } from '../core'
import type { Module, Options } from '../types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { resolve } from 'pathe'
import tildify from 'tildify'
import { promptExtensionSettings } from '../extensions'
import { buildUpgradePack, MODULE_GROUPS, MODULE_OPTIONS, resolveUpgradeResources } from '../upgrade'
import { confirmOutput, promptBundle } from './shared'

export async function runUpgradeCommand(config: Options): Promise<void> {
  const initialValues: Module[] = []

  for (const module of config.modules ?? []) {
    const option = MODULE_OPTIONS.find(option => option.value === module)
    if (!option)
      throw new Error(`unknown module: ${module}`)

    initialValues.push(option.value)
  }

  const controller = new AbortController()
  const modules = await p.groupMultiselect<Module>({
    message: 'select modules to upgrade',
    options: MODULE_GROUPS,
    initialValues,
    required: false,
    selectableGroups: false,
    signal: controller.signal,
  })

  if (p.isCancel(modules)) {
    p.cancel('aborting')
    return
  }

  if (!modules.length) {
    p.cancel('no modules selected')
    return
  }

  let bundle: Bundle | undefined

  if (config.version !== undefined || modules.some(module => ['atmosphere', 'sigpatches', 'mission-control'].includes(module))) {
    const selected = await promptBundle(config.version, controller.signal)
    if (p.isCancel(selected)) {
      p.cancel('aborting')
      return
    }

    bundle = selected
  }

  const cwd = config.cwd || process.cwd()
  const name = modules.length === 1 ? modules[0] : 'upgrade'
  const destination = resolve(config.output || cwd, `${name}${config.pack ? '.zip' : ''}`)
  const replace = await confirmOutput(destination, cwd)

  if (replace === undefined)
    return

  const spinner = p.spinner({
    onCancel: () => controller.abort(),
    cancelMessage: 'cancelling upgrade',
  })
  const task = {
    signal: controller.signal,
    onProgress: (message: string) => spinner.message(c.cyan(message)),
  }

  try {
    const settings = await promptExtensionSettings(modules, controller)

    spinner.start(c.cyan('resolving selected modules'))
    if (process.stdin.isTTY)
      process.stdin.setRawMode(false)

    const resources = await resolveUpgradeResources(modules, { ...task, ...settings, bundle })

    await buildUpgradePack({ ...task, modules, resources, bundle, directory: destination, replace, pack: config.pack, extra: config.extra })

    spinner.stop(c.green('upgrade pack assembled'))
  }
  catch (error) {
    if (controller.signal.aborted) {
      p.cancel('upgrade cancelled; temporary files removed')
      process.exitCode = 130
      return
    }

    spinner.error('upgrade failed')
    throw error
  }

  p.outro(`${c.green('upgrade ready:')} ${c.cyan(tildify(destination))}`)
}
