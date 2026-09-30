import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import * as p from '@clack/prompts'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { selectAsset } from '../utils'

export type PerformanceMonitor = 'status-monitor' | 'status-monitor-deux'

export async function promptPerformanceMonitoring(controller: AbortController): Promise<PerformanceMonitor | undefined> {
  const enabled = await p.confirm({
    message: 'include performance monitoring?',
    signal: controller.signal,
  })

  if (p.isCancel(enabled)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (!enabled)
    return undefined

  const module = await p.select<PerformanceMonitor>({
    message: 'select performance monitor',
    initialValue: 'status-monitor',
    signal: controller.signal,
    options: [
      { value: 'status-monitor', label: 'Status Monitor', hint: `https://github.com/${EXTENSION_REPO_CONFIG['status-monitor']}` },
      { value: 'status-monitor-deux', label: 'Status Monitor Deux', hint: `https://github.com/${EXTENSION_REPO_CONFIG['status-monitor-deux']}` },
    ],
  })

  if (p.isCancel(module)) {
    controller.abort()
    throw controller.signal.reason
  }

  return module
}

export async function resolvePerformanceMonitoring(module: PerformanceMonitor, { signal, onProgress }: TaskOptions = {}): Promise<Resource> {
  signal?.throwIfAborted()

  onProgress?.(`resolving ${module} (latest)`)
  const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)
  const asset = selectAsset(release, module === 'status-monitor' ? /^Status-Monitor-Overlay\.ovl$/ : /^Status-Monitor-Deux\.zip$/)

  return {
    module,
    release: release.tag_name,
    page: release.html_url,
    asset,
    target: module === 'status-monitor' ? 'switch/.overlays/Status-Monitor-Overlay.ovl' : undefined,
  }
}
