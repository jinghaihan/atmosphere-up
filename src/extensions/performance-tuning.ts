import type { Resource } from '../core/plan'
import type { ExtensionContext } from './types'
import { readFile, writeFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import { join } from 'pathe'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { configureHorizonOcBootEntries, getRepositoryUrl, selectAsset } from '../utils'
import { resolveSaltyNx } from './dependencies'

export type PerformanceTool = 'sys-clk' | 'sys-clk-overlay-ultrahand' | 'horizon-oc' | 'fps-locker' | 'reverse-nx-rt' | 'fizeau'

export const PERFORMANCE_TUNING_OPTIONS = [
  { value: 'sys-clk', label: 'Sys Clk', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['sys-clk']) },
  { value: 'sys-clk-overlay-ultrahand', label: 'Sys Clk Overlay Ultrahand', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['sys-clk-overlay-ultrahand']) },
  { value: 'horizon-oc', label: 'Horizon OC', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['horizon-oc']) },
  { value: 'fps-locker', label: 'FPS Locker', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['fps-locker']) },
  { value: 'reverse-nx-rt', label: 'ReverseNx RT', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['reverse-nx-rt']) },
  { value: 'fizeau', label: 'Fizeau', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG.fizeau) },
] satisfies { value: PerformanceTool, label: string, hint: string }[]

export async function promptPerformanceTuning(controller: AbortController): Promise<PerformanceTool[]> {
  const modules = await p.multiselect<PerformanceTool>({
    message: 'select performance tools',
    initialValues: ['sys-clk', 'sys-clk-overlay-ultrahand', 'fps-locker', 'reverse-nx-rt'],
    signal: controller.signal,
    options: PERFORMANCE_TUNING_OPTIONS,
  })

  if (p.isCancel(modules)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (modules.includes('horizon-oc') && modules.includes('sys-clk')) {
    p.note(
      'when both are selected, Horizon OC supplies the clock service. The original Sys Clk manager and overlay cannot connect to it; use Horizon OC or Sys Clk Overlay Ultrahand for clock controls.',
      'horizon oc',
    )
  }

  return modules
}

export async function resolvePerformanceTuning(modules: PerformanceTool[], { signal, onProgress, resources: existing = [] }: ExtensionContext = {}): Promise<Resource[]> {
  const selected = new Set<PerformanceTool | 'salty-nx'>(modules)

  if (selected.has('sys-clk-overlay-ultrahand') && !selected.has('horizon-oc'))
    selected.add('sys-clk')

  if (selected.has('fps-locker') || selected.has('reverse-nx-rt'))
    selected.add('salty-nx')

  // Install the selected clock service before replacing its overlay frontend.
  const order = ['sys-clk', 'horizon-oc', 'sys-clk-overlay-ultrahand', 'salty-nx', 'fps-locker', 'reverse-nx-rt', 'fizeau'] as const
  const resources: Resource[] = []

  for (const module of order) {
    if (!selected.has(module))
      continue

    signal?.throwIfAborted()

    if (module === 'salty-nx') {
      if (existing.some(resource => resource.module === 'salty-nx'))
        continue

      resources.push(await resolveSaltyNx({ signal, onProgress }))
      continue
    }

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
          paths: ['atmosphere/', 'config/', selected.has('sys-clk-overlay-ultrahand') ? 'switch/sys-clk-manager.nro' : 'switch/'],
        }))
        break
      case 'sys-clk-overlay-ultrahand':
        resources.push(resource(/^sys-clk-overlay\.ovl$/, { target: 'switch/.overlays/sys-clk-overlay.ovl' }))
        break
      case 'horizon-oc':
        resources.push(resource(/^dist\.zip$/, {
          paths: ['atmosphere/', 'config/', 'switch/.overlays/horizon-oc-overlay.ovl'],
          configure: async (directory) => {
            const path = join(directory, 'bootloader/hekate_ipl.ini')
            await writeFile(path, configureHorizonOcBootEntries(await readFile(path, 'utf8')))
          },
        }))
        break
      case 'fps-locker':
        resources.push(resource(/^FPSLocker\.ovl$/, { target: 'switch/.overlays/FPSLocker.ovl' }))
        break
      case 'reverse-nx-rt':
        resources.push(resource(/^ReverseNX-RT-ovl\.ovl$/, { target: 'switch/.overlays/ReverseNX-RT-ovl.ovl' }))
        break
      case 'fizeau':
        resources.push(resource(/^Fizeau-.*\.zip$/))
        break
    }
  }

  return resources
}
