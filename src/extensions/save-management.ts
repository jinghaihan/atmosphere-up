import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import * as p from '@clack/prompts'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { getRepositoryUrl, selectAsset } from '../utils'

export type SaveManager = 'jksv' | 'checkpoint'

export async function resolveSaveManagement(modules: SaveManager[], { signal, onProgress }: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const module of modules) {
    signal?.throwIfAborted()

    onProgress?.(`resolving ${module} (latest)`)
    const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)
    const asset = selectAsset(release, new RegExp(`^${module}\\.nro$`, 'i'))

    resources.push({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset,
      target: `switch/${asset.name.slice(0, -4)}/${asset.name}`,
    })
  }

  return resources
}

export async function promptSaveManagement(controller: AbortController): Promise<SaveManager[]> {
  const enabled = await p.confirm({
    message: 'include save management?',
    signal: controller.signal,
  })

  if (p.isCancel(enabled)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (!enabled)
    return []

  const module = await p.select<SaveManager>({
    message: 'select save manager',
    initialValue: 'jksv',
    signal: controller.signal,
    options: [
      { value: 'jksv', label: 'JKSV', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG.jksv) },
      { value: 'checkpoint', label: 'Checkpoint', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG.checkpoint) },
    ],
  })

  if (p.isCancel(module)) {
    controller.abort()
    throw controller.signal.reason
  }

  return [module]
}
