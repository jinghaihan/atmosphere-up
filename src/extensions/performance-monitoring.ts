import type { Resource } from '../core/plan'
import type { ExtensionContext } from './types'
import * as p from '@clack/prompts'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { getRepositoryUrl, selectAsset } from '../utils'
import { resolveSaltyNx } from './dependencies'

export type PerformanceMonitor = 'status-monitor' | 'status-monitor-deux'

export async function promptPerformanceMonitoring(controller: AbortController): Promise<PerformanceMonitor[]> {
  const module = await p.select<PerformanceMonitor>({
    message: 'select performance monitor',
    initialValue: 'status-monitor',
    signal: controller.signal,
    options: [
      { value: 'status-monitor', label: 'Status Monitor', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['status-monitor']) },
      { value: 'status-monitor-deux', label: 'Status Monitor Deux', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['status-monitor-deux']) },
    ],
  })

  if (p.isCancel(module)) {
    controller.abort()
    throw controller.signal.reason
  }

  return [module]
}

export async function resolvePerformanceMonitoring(modules: PerformanceMonitor[], { signal, onProgress, resources: existing = [] }: ExtensionContext = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  if (modules.length && !existing.some(resource => resource.module === 'salty-nx'))
    resources.push(await resolveSaltyNx({ signal, onProgress }))

  for (const module of modules) {
    signal?.throwIfAborted()

    onProgress?.(`resolving ${module} (latest)`)
    const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)
    const asset = selectAsset(release, module === 'status-monitor' ? /^Status-Monitor-Overlay\.ovl$/ : /^Status-Monitor-Deux\.zip$/)

    resources.push({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset,
      target: module === 'status-monitor' ? 'switch/.overlays/Status-Monitor-Overlay.ovl' : undefined,
    })
  }

  return resources
}
