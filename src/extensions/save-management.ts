import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { selectAsset } from '../utils'

export type SaveManager = keyof typeof EXTENSION_REPO_CONFIG

export async function resolveSaveManagement(module: SaveManager, { signal, onProgress }: TaskOptions = {}): Promise<Resource> {
  signal?.throwIfAborted()

  onProgress?.(`resolving ${module} (latest)`)
  const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)
  const asset = selectAsset(release, new RegExp(`^${module}\\.nro$`, 'i'))

  return {
    module,
    release: release.tag_name,
    page: release.html_url,
    asset,
    target: `switch/${asset.name.slice(0, -4)}/${asset.name}`,
  }
}
