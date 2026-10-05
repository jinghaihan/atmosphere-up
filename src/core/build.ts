import type { TaskOptions } from '../types'
import type { Bundle } from './catalog'
import type { Resource } from './plan'
import { copyFile, cp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import { PACK_DEFAULTS } from '../constants'
import { sha256 } from '../utils'
import { extractArchive } from './archive'
import { getBundlePath } from './catalog'
import { installResources } from './install'
import { writeOutput } from './output'

export interface BuildOptions extends TaskOptions {
  bundle: Bundle
  resources: Resource[]
  directory: string
  replace?: boolean
  pack?: boolean
  extra?: string
  onCoreReady?: () => Promise<Resource[]>
  onExtensionsReady?: () => Promise<Resource[]>
}

export async function buildPack({ bundle, resources, directory, replace = false, pack = false, extra, ...task }: BuildOptions): Promise<void> {
  const { signal, onProgress } = task

  await writeOutput({
    ...task,
    directory,
    replace,
    pack,
    extra,
    populate: async (staging) => {
      onProgress?.(`checking bundled sigpatches for HOS ${bundle.labels.hos}`)
      const sigpatches = await readFile(getBundlePath(bundle))
      if (sha256(sigpatches) !== bundle.sha256)
        throw new Error(`SHA-256 mismatch for bundled sigpatches: ${bundle.id}.`)

      const downloads = await installResources(resources, staging, task)

      signal?.throwIfAborted()
      onProgress?.(`integrating sigpatches for Atmosphere ${bundle.labels.atmosphere}`)
      await extractArchive(sigpatches, staging)

      signal?.throwIfAborted()
      onProgress?.('applying Atmosphere, Hekate, and overlay settings')
      await cp(PACK_DEFAULTS, staging, { recursive: true })

      signal?.throwIfAborted()
      onProgress?.('setting Hekate reboot payload')
      // Return to Hekate after a reboot so package3 boot keeps using patches.ini.
      await copyFile(join(staging, 'payload.bin'), join(staging, 'atmosphere/reboot_payload.bin'))

      signal?.throwIfAborted()
      const extensions = await task.onCoreReady?.() ?? []

      signal?.throwIfAborted()
      downloads.push(...await installResources(extensions, staging, task))

      signal?.throwIfAborted()
      const firmware = await task.onExtensionsReady?.() ?? []

      signal?.throwIfAborted()
      downloads.push(...await installResources(firmware, staging, task))

      signal?.throwIfAborted()
      onProgress?.('writing pack manifest')
      await writeFile(
        join(staging, 'pack-manifest.json'),
        `${JSON.stringify({
          hos: bundle.labels.hos,
          atmosphere: bundle.labels.atmosphere,
          createdAt: new Date().toISOString(),
          sigpatches: {
            id: bundle.id,
            sha256: bundle.sha256,
            sources: bundle.sources,
          },
          resources: downloads.map(({ resource, sha256 }) => ({
            module: resource.module,
            release: resource.release,
            page: resource.page,
            asset: resource.asset.name,
            url: resource.asset.browser_download_url,
            sha256,
          })),
        }, null, 2)}\n`,
      )
    },
  })
}
