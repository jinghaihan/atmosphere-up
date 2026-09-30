import type { ReleaseAsset, TaskOptions } from '../types'
import type { Bundle } from './catalog'
import { MODULE_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { selectAsset } from '../utils'

export interface Resource {
  module: keyof typeof MODULE_REPO_CONFIG
  release: string
  page: string
  asset: ReleaseAsset
  target?: string
}

export async function resolveResources(bundle: Bundle, { signal, onProgress }: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []
  const entries = Object.entries(MODULE_REPO_CONFIG)
  for (const [index, [module, repo]] of entries.entries()) {
    signal?.throwIfAborted()
    const tag = module === 'atmosphere' ? bundle.atmosphereTag : undefined
    onProgress?.(`[${index + 1}/${entries.length}] resolving ${module} (${tag || 'latest'})`)
    const release = await getRelease(repo, tag, signal)
    const resource = (pattern: RegExp, target?: string): Resource => ({
      module: module as Resource['module'],
      release: release.tag_name,
      page: release.html_url,
      asset: selectAsset(release, pattern),
      target,
    })
    switch (module) {
      case 'atmosphere':
        resources.push(
          resource(/^atmosphere-.*\.zip$/),
          resource(/^fusee\.bin$/, 'bootloader/payloads/fusee.bin'),
        )
        break
      case 'dbi':
        resources.push(
          resource(/^DBI\.nro$/, 'switch/DBI/DBI.nro'),
          resource(/^dbi\.config$/, 'switch/DBI/dbi.config'),
        )
        break
      case 'hekate':
        resources.push(
          resource(/^hekate_ctcaer_[\d.]+_Nyx_[\d.]+\.zip$/),
          resource(/^hekate_ctcaer_[\d.]+\.bin$/, 'payload.bin'),
        )
        break
      case 'sys-patch':
        resources.push(resource(/^sys-patch.*\.zip$/))
        break
      case 'ultrahand':
        resources.push(resource(/^sdout\.zip$/))
        break
      default:
        throw new Error(`Unknown core module: ${module}.`)
    }
  }
  return resources
}
