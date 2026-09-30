import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import * as p from '@clack/prompts'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { getRepositoryUrl, selectAsset } from '../utils'

export type FileManager = 'nx-shell'

export async function resolveFileManagement(modules: FileManager[], { signal, onProgress }: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const module of modules) {
    signal?.throwIfAborted()

    onProgress?.(`resolving ${module} (latest)`)
    const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)
    const asset = selectAsset(release, /^NX-Shell\.nro$/i)

    resources.push({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset,
      target: 'switch/NX-Shell/NX-Shell.nro',
    })
  }

  return resources
}

export async function promptFileManagement(controller: AbortController): Promise<FileManager[]> {
  const enabled = await p.confirm({
    message: 'include file management?',
    signal: controller.signal,
  })

  if (p.isCancel(enabled)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (!enabled)
    return []

  const module = await p.select<FileManager>({
    message: 'select file manager',
    initialValue: 'nx-shell',
    signal: controller.signal,
    options: [
      { value: 'nx-shell', label: 'NX Shell', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['nx-shell']) },
    ],
  })

  if (p.isCancel(module)) {
    controller.abort()
    throw controller.signal.reason
  }

  return [module]
}
