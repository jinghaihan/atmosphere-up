import type { Bundle } from './catalog'
import type { Resource } from './plan'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'pathe'
import { HEKATE_BOOT_CONFIG, MODULE_REPO_CONFIG } from '../constants'
import { downloadAsset } from '../download'
import { sha256 } from '../utils'
import { extractArchive } from './archive'
import { getBundlePath } from './catalog'
import { writeOutput } from './output'

export async function buildPack(bundle: Bundle, resources: Resource[], directory: string, replace = false, pack = false): Promise<void> {
  await writeOutput(directory, replace, async (staging) => {
    const sigpatches = await readFile(getBundlePath(bundle))
    if (sha256(sigpatches) !== bundle.sha256)
      throw new Error(`SHA-256 mismatch for bundled sigpatches: ${bundle.id}.`)
    const downloads = await Promise.all(resources.map(async resource => ({ resource, data: await downloadAsset(MODULE_REPO_CONFIG[resource.module], resource.asset) })))
    for (const { resource, data } of downloads) {
      if (resource.target) {
        const target = join(staging, resource.target)
        await mkdir(dirname(target), { recursive: true })
        await writeFile(target, data)
      }
      else {
        await extractArchive(data, staging)
      }
    }
    await extractArchive(sigpatches, staging)
    // Return to Hekate after a reboot so package3 boot keeps using patches.ini.
    await copyFile(join(staging, 'payload.bin'), join(staging, 'atmosphere/reboot_payload.bin'))
    await writeFile(join(staging, 'bootloader/hekate_ipl.ini'), HEKATE_BOOT_CONFIG)
    await writeFile(join(staging, 'pack-manifest.json'), `${JSON.stringify({
      hos: bundle.labels.hos,
      atmosphere: bundle.labels.atmosphere,
      createdAt: new Date().toISOString(),
      sigpatches: { id: bundle.id, sha256: bundle.sha256, sources: bundle.sources },
      resources: downloads.map(({ resource, data }) => ({
        module: resource.module,
        release: resource.release,
        page: resource.page,
        asset: resource.asset.name,
        url: resource.asset.browser_download_url,
        sha256: sha256(data),
      })),
    }, null, 2)}\n`)
  }, pack)
}
