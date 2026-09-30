import type { TaskOptions } from '../types'
import type { Bundle } from './catalog'
import type { Resource } from './plan'
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'pathe'
import { HEKATE_BOOT_CONFIG, PACK_DEFAULTS, ULTRAHAND_KEY_COMBO } from '../constants'
import { downloadAsset } from '../download'
import { formatDownloadProgress, sha256 } from '../utils'
import { extractArchive } from './archive'
import { getBundlePath } from './catalog'
import { writeOutput } from './output'

export async function buildPack(bundle: Bundle, resources: Resource[], directory: string, replace = false, pack = false, task: TaskOptions = {}): Promise<void> {
  const { signal, onProgress } = task
  await writeOutput(directory, replace, async (staging) => {
    onProgress?.(`checking bundled sigpatches for HOS ${bundle.labels.hos}`)
    const sigpatches = await readFile(getBundlePath(bundle))
    if (sha256(sigpatches) !== bundle.sha256)
      throw new Error(`SHA-256 mismatch for bundled sigpatches: ${bundle.id}.`)
    const downloads: { resource: Resource, sha256: string }[] = []
    for (const [index, resource] of resources.entries()) {
      signal?.throwIfAborted()
      const label = `${resource.module} [${index + 1}/${resources.length}]`
      onProgress?.(`downloading ${label} · ${formatDownloadProgress(0, resource.asset.size)}`)
      const data = await downloadAsset(resource.asset, {
        signal,
        onProgress: received => onProgress?.(`downloading ${label} · ${formatDownloadProgress(received, resource.asset.size)}`),
      })
      signal?.throwIfAborted()
      if (resource.target) {
        onProgress?.(`installing ${label}`)
        const target = join(staging, resource.target)
        await mkdir(dirname(target), { recursive: true })
        await writeFile(target, data)
      }
      else {
        onProgress?.(`extracting ${label}`)
        await extractArchive(data, staging)
      }
      downloads.push({ resource, sha256: sha256(data) })
    }
    signal?.throwIfAborted()
    onProgress?.(`integrating sigpatches for Atmosphere ${bundle.labels.atmosphere}`)
    await extractArchive(sigpatches, staging)
    signal?.throwIfAborted()
    onProgress?.('applying Atmosphere settings and Nintendo hosts')
    await cp(PACK_DEFAULTS, staging, { recursive: true })
    signal?.throwIfAborted()
    onProgress?.('writing Hekate boot entries and Ultrahand wake keys')
    // Return to Hekate after a reboot so package3 boot keeps using patches.ini.
    await copyFile(join(staging, 'payload.bin'), join(staging, 'atmosphere/reboot_payload.bin'))
    await writeFile(join(staging, 'bootloader/hekate_ipl.ini'), await readFile(HEKATE_BOOT_CONFIG))
    for (const name of ['ultrahand', 'tesla']) {
      const directory = join(staging, 'config', name)
      await mkdir(directory, { recursive: true })
      await writeFile(join(directory, 'config.ini'), `[${name}]\nkey_combo=${ULTRAHAND_KEY_COMBO}\n`)
    }
    onProgress?.('writing pack manifest')
    await writeFile(join(staging, 'pack-manifest.json'), `${JSON.stringify({
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
    }, null, 2)}\n`)
  }, pack, task)
}
