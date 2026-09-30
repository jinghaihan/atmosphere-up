import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import * as p from '@clack/prompts'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { getRepositoryUrl, selectAsset } from '../utils'

export type CheatTool = 'edizon-overlay' | 'edizon-se' | 'breeze' | 'breezehand'

export async function resolveCheats(modules: CheatTool[], { signal, onProgress }: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const module of modules) {
    signal?.throwIfAborted()

    onProgress?.(`resolving ${module} (latest)`)
    const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)
    const resource = (pattern: RegExp, options: Pick<Resource, 'target' | 'paths'> = {}): Resource => ({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset: selectAsset(release, pattern),
      ...options,
    })

    switch (module) {
      case 'edizon-overlay':
        resources.push(resource(/^ovlEdiZon\.ovl$/, { target: 'switch/.overlays/ovlEdiZon.ovl' }))
        break
      case 'edizon-se':
        resources.push(resource(/^edizon\.zip$/, { paths: ['switch/edizon/'] }))
        break
      case 'breeze':
        resources.push(resource(/^Breeze\.zip$/, { paths: ['switch/breeze/'] }))
        break
      case 'breezehand':
        resources.push(resource(/^breezehand\.zip$/, { paths: ['switch/.overlays/breezehand.ovl', 'config/breezehand/'] }))
        break
    }
  }

  return resources
}

export async function promptCheats(controller: AbortController): Promise<CheatTool[]> {
  const enabled = await p.confirm({
    message: 'include cheats?',
    signal: controller.signal,
  })

  if (p.isCancel(enabled)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (!enabled)
    return []

  const modules = await p.multiselect<CheatTool>({
    message: 'select cheat tools',
    initialValues: ['edizon-overlay'],
    signal: controller.signal,
    options: [
      { value: 'edizon-overlay', label: 'EdiZon Overlay', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['edizon-overlay']) },
      { value: 'edizon-se', label: 'EdiZon SE', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['edizon-se']) },
      { value: 'breeze', label: 'Breeze', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG.breeze) },
      { value: 'breezehand', label: 'Breezehand Overlay', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG.breezehand) },
    ],
  })

  if (p.isCancel(modules)) {
    controller.abort()
    throw controller.signal.reason
  }

  return modules
}
