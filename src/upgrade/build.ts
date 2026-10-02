import type { Bundle, Resource } from '../core'
import type { Module, TaskOptions } from '../types'
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'pathe'
import { CORE_REPO_CONFIG, PACK_DEFAULTS } from '../constants'
import { extractArchive, getBundlePath, writeOutput } from '../core'
import { installResources } from '../core/install'
import { sha256 } from '../utils'

export interface UpgradePackOptions extends TaskOptions {
  modules: Module[]
  resources: Resource[]
  bundle?: Bundle
  directory: string
  replace?: boolean
  pack?: boolean
}

export async function buildUpgradePack({ modules, resources, bundle, directory, replace, pack, ...task }: UpgradePackOptions): Promise<void> {
  await writeOutput({
    ...task,
    directory,
    replace,
    pack,
    populate: async (staging) => {
      const core = resources.filter(resource => resource.module in CORE_REPO_CONFIG)
      const optional = resources.filter(resource => !(resource.module in CORE_REPO_CONFIG))
      const downloads = await installResources(core, staging, task)

      if (bundle && (modules.includes('atmosphere') || modules.includes('sigpatches'))) {
        task.signal?.throwIfAborted()
        task.onProgress?.(`integrating sigpatches for Atmosphere ${bundle.labels.atmosphere}`)
        const sigpatches = await readFile(getBundlePath(bundle))
        if (sha256(sigpatches) !== bundle.sha256)
          throw new Error(`SHA-256 mismatch for bundled sigpatches: ${bundle.id}.`)

        await extractArchive(sigpatches, staging)
      }

      const defaults = new Set<string>()

      if (modules.includes('atmosphere')) {
        defaults.add('atmosphere')
        defaults.add('exosphere.ini')
      }

      if (modules.includes('hekate'))
        defaults.add('bootloader')

      if (modules.includes('horizon-oc'))
        defaults.add('bootloader/hekate_ipl.ini')

      if (modules.includes('ultrahand')) {
        defaults.add('config/ultrahand')
        defaults.add('config/tesla')
        defaults.add('config/nx-ovlloader')
      }

      for (const path of defaults) {
        task.signal?.throwIfAborted()
        task.onProgress?.(`applying defaults for ${path}`)
        await mkdir(dirname(join(staging, path)), { recursive: true })
        await cp(new URL(path, PACK_DEFAULTS), join(staging, path), { recursive: true })
      }

      if (modules.includes('hekate')) {
        task.signal?.throwIfAborted()
        task.onProgress?.('setting Hekate reboot payload')
        await mkdir(join(staging, 'atmosphere'), { recursive: true })
        await copyFile(join(staging, 'payload.bin'), join(staging, 'atmosphere/reboot_payload.bin'))
      }

      downloads.push(...await installResources(optional, staging, task))

      task.signal?.throwIfAborted()
      task.onProgress?.('writing upgrade manifest')
      await writeFile(join(staging, 'upgrade-manifest.json'), `${JSON.stringify({
        modules,
        hos: bundle?.labels.hos,
        createdAt: new Date().toISOString(),
        resources: downloads.map(({ resource, sha256 }) => ({
          module: resource.module,
          release: resource.release,
          page: resource.page,
          asset: resource.asset.name,
          sha256,
        })),
      }, null, 2)}\n`)
    },
  })
}
