import type { Release, ReleaseAsset, TaskOptions } from '../types'
import type { Bundle } from './catalog'
import { CORE_REPO_CONFIG, DBI_TRANSLATION_REPO } from '../constants'
import { getRelease } from '../download'
import { selectAsset } from '../utils'

export interface Resource {
  module: string
  release: string
  page: string
  asset: ReleaseAsset
  target?: string
  directory?: string
  paths?: string[]
  configure?: (directory: string) => Promise<void>
}

export interface CoreResourceOptions extends TaskOptions {
  modules?: (keyof typeof CORE_REPO_CONFIG)[]
}

export async function resolveResources(bundle: Bundle | undefined, { signal, onProgress, modules }: CoreResourceOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []
  const entries = Object.entries(CORE_REPO_CONFIG).filter(([module]) => !modules || modules.includes(module as keyof typeof CORE_REPO_CONFIG))

  for (const [index, [module, repo]] of entries.entries()) {
    signal?.throwIfAborted()

    if (module === 'atmosphere' && !bundle)
      throw new Error('HOS version is required for Atmosphere')

    const tag = module === 'atmosphere' ? bundle!.atmosphereTag : undefined
    onProgress?.(`[${index + 1}/${entries.length}] resolving ${module} (${tag || 'latest'})`)
    const release = await getRelease(repo, tag, signal)

    const resource = (pattern: RegExp, target?: string, source: Release = release): Resource => ({
      module: module as Resource['module'],
      release: source.tag_name,
      page: source.html_url,
      asset: selectAsset(source, pattern),
      target,
    })

    switch (module) {
      case '90dns-tester':
        resources.push(resource(/^Switch_90DNS_tester\.nro$/, 'switch/90DNS-Tester/Switch_90DNS_tester.nro'))
        break
      case 'atmosphere':
        resources.push(
          resource(/^atmosphere-.*\.zip$/),
          resource(/^fusee\.bin$/, 'bootloader/payloads/fusee.bin'),
        )
        break
      case 'dbi': {
        const translation = await getRelease(DBI_TRANSLATION_REPO, undefined, signal)

        resources.push(
          resource(/^DBI\.nro$/, 'switch/DBI/DBI.nro', translation),
          resource(/^translation_en\.bin$/, 'switch/DBI/translation.bin', translation),
          resource(/^dbi\.config$/, 'switch/DBI/dbi.config'),
        )
        break
      }
      case 'hekate':
        resources.push(
          resource(/^hekate_ctcaer_[\d.]+_Nyx_[\d.]+\.zip$/),
          resource(/^hekate_ctcaer_[\d.]+\.bin$/, 'payload.bin'),
        )
        break
      case 'lockpick-rcm':
        resources.push(resource(/^Lockpick_RCM-[\d.]+_Hekate\.zip$/))
        break
      case 'ovl-sysmodules':
        resources.push(resource(/^ovlSysmodules\.ovl$/, 'switch/.overlays/ovlSysmodules.ovl'))
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
