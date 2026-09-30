import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import { readFile, writeFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import { join } from 'pathe'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease, getRepositoryFile } from '../download'
import { configureHorizonOcBootEntries, selectAsset } from '../utils'

export type PerformanceTool = 'sys-clk' | 'sys-clk-ultrahand-overlay' | 'horizon-oc' | 'fps-locker' | 'reverse-nx-rt'

export async function promptPerformanceTuning(controller: AbortController): Promise<PerformanceTool[]> {
  const enabled = await p.confirm({
    message: 'include performance tuning?',
    signal: controller.signal,
  })

  if (p.isCancel(enabled)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (!enabled)
    return []

  const modules = await p.multiselect<PerformanceTool>({
    message: 'select performance tools',
    initialValues: ['sys-clk', 'sys-clk-ultrahand-overlay', 'fps-locker', 'reverse-nx-rt'],
    signal: controller.signal,
    options: [
      { value: 'sys-clk', label: 'Sys Clk', hint: `https://github.com/${EXTENSION_REPO_CONFIG['sys-clk']}` },
      { value: 'sys-clk-ultrahand-overlay', label: 'Sys Clk Ultrahand Overlay', hint: `https://github.com/${EXTENSION_REPO_CONFIG['sys-clk-ultrahand-overlay']}` },
      { value: 'horizon-oc', label: 'Horizon OC', hint: `https://github.com/${EXTENSION_REPO_CONFIG['horizon-oc']}` },
      { value: 'fps-locker', label: 'FPS Locker', hint: `https://github.com/${EXTENSION_REPO_CONFIG['fps-locker']}` },
      { value: 'reverse-nx-rt', label: 'ReverseNx RT', hint: `https://github.com/${EXTENSION_REPO_CONFIG['reverse-nx-rt']}` },
    ],
  })

  if (p.isCancel(modules)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (modules.includes('horizon-oc') && modules.includes('sys-clk')) {
    p.note(
      'when both are selected, Horizon OC supplies the clock service. The original Sys Clk manager and overlay cannot connect to it; use Horizon OC or Sys Clk Ultrahand Overlay for clock controls.',
      'horizon oc',
    )
  }

  return modules
}

export async function resolvePerformanceTuning(modules: PerformanceTool[], { signal, onProgress }: TaskOptions = {}, atmosphere?: string): Promise<Resource[]> {
  const selected = new Set<PerformanceTool | 'salty-nx'>(modules)

  if (selected.has('sys-clk-ultrahand-overlay') && !selected.has('horizon-oc'))
    selected.add('sys-clk')

  if (selected.has('fps-locker') || selected.has('reverse-nx-rt'))
    selected.add('salty-nx')

  // Install the selected clock service before replacing its overlay frontend.
  const order = ['sys-clk', 'horizon-oc', 'sys-clk-ultrahand-overlay', 'salty-nx', 'fps-locker', 'reverse-nx-rt'] as const
  const resources: Resource[] = []

  for (const module of order) {
    if (!selected.has(module))
      continue

    signal?.throwIfAborted()

    onProgress?.(`resolving ${module} (latest)`)
    const repository = EXTENSION_REPO_CONFIG[module]
    const release = await getRelease(repository, undefined, signal)
    const resource = (pattern: RegExp, options: Pick<Resource, 'target' | 'paths' | 'configure'> = {}): Resource => ({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset: selectAsset(release, pattern),
      ...options,
    })

    switch (module) {
      case 'sys-clk':
        resources.push(resource(/^sys-clk-.*\.zip$/, {
          paths: ['atmosphere/', 'config/', selected.has('sys-clk-ultrahand-overlay') ? 'switch/sys-clk-manager.nro' : 'switch/'],
        }))
        break
      case 'sys-clk-ultrahand-overlay':
        resources.push(resource(/^sys-clk-overlay\.ovl$/, { target: 'switch/.overlays/sys-clk-overlay.ovl' }))
        break
      case 'horizon-oc': {
        if (atmosphere) {
          const supported = (await getRepositoryFile(repository, 'ams_ver.txt', release.tag_name, signal)).trim()
          if (supported !== atmosphere)
            throw new Error(`Horizon OC ${release.tag_name} requires Atmosphere ${supported}; the selected pack uses ${atmosphere}.`)
        }

        resources.push(resource(/^dist\.zip$/, {
          paths: ['atmosphere/', 'config/', 'switch/.overlays/horizon-oc-overlay.ovl'],
          configure: async (directory) => {
            const path = join(directory, 'bootloader/hekate_ipl.ini')
            await writeFile(path, configureHorizonOcBootEntries(await readFile(path, 'utf8')))
          },
        }))
        break
      }
      case 'salty-nx':
        resources.push(resource(/^SaltyNX\.zip$/))
        break
      case 'fps-locker':
        resources.push(resource(/^FPSLocker\.ovl$/, { target: 'switch/.overlays/FPSLocker.ovl' }))
        break
      case 'reverse-nx-rt':
        resources.push(resource(/^ReverseNX-RT-ovl\.ovl$/, { target: 'switch/.overlays/ReverseNX-RT-ovl.ovl' }))
        break
    }
  }

  return resources
}
