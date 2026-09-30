import type { ReleaseAsset } from '../types'
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

export async function resolveResources(bundle: Bundle): Promise<Resource[]> {
  const entries = await Promise.all(Object.entries(MODULE_REPO_CONFIG).map(async ([module, repo]) => {
    const release = await getRelease(repo, module === 'atmosphere' ? bundle.atmosphereTag : undefined)
    const resource = (pattern: RegExp, target?: string): Resource => ({
      module: module as Resource['module'],
      release: release.tag_name,
      page: release.html_url,
      asset: selectAsset(release, pattern),
      target,
    })
    switch (module) {
      case 'atmosphere':
        return [resource(/^atmosphere-.*\.zip$/), resource(/^fusee\.bin$/, 'bootloader/payloads/fusee.bin')]
      case 'dbi':
        return [resource(/^DBI\.nro$/, 'switch/DBI/DBI.nro'), resource(/^dbi\.config$/, 'switch/DBI/dbi.config')]
      case 'hekate':
        return [resource(/^hekate_ctcaer_[\d.]+_Nyx_[\d.]+\.zip$/), resource(/^hekate_ctcaer_[\d.]+\.bin$/, 'payload.bin')]
      case 'sys-patch':
        return [resource(/^sys-patch.*\.zip$/)]
      case 'ultrahand':
        return [resource(/^sdout\.zip$/)]
      default:
        throw new Error(`Unknown core module: ${module}.`)
    }
  }))
  return entries.flat()
}
