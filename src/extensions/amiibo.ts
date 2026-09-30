import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import { cp, rm } from 'node:fs/promises'
import * as p from '@clack/prompts'
import { join } from 'pathe'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { getRepositoryUrl, selectAsset } from '../utils'

export type AmiiboTool = 'emuiibo'

export async function resolveAmiibo(modules: AmiiboTool[], { signal, onProgress }: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const module of modules) {
    signal?.throwIfAborted()

    onProgress?.(`resolving ${module} (latest)`)
    const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)

    resources.push({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset: selectAsset(release, /^emuiibo\.zip$/),
      configure: async (directory) => {
        const source = join(directory, 'SdOut')
        await cp(source, directory, { recursive: true })
        await rm(source, { recursive: true })
      },
    })
  }

  return resources
}

export async function promptAmiibo(controller: AbortController): Promise<AmiiboTool[]> {
  const module = await p.select<AmiiboTool>({
    message: 'select amiibo tool',
    initialValue: 'emuiibo',
    signal: controller.signal,
    options: [
      { value: 'emuiibo', label: 'Emuiibo', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG.emuiibo) },
    ],
  })

  if (p.isCancel(module)) {
    controller.abort()
    throw controller.signal.reason
  }

  return [module]
}
