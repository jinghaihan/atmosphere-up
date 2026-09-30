import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { selectAsset } from '../utils'

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
