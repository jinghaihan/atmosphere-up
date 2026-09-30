import type { TaskOptions } from '../types'
import type { Resource } from './plan'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'pathe'
import { downloadAsset } from '../download'
import { formatDownloadProgress, sha256 } from '../utils'
import { extractArchive } from './archive'

export async function installResources(resources: Resource[], directory: string, { signal, onProgress }: TaskOptions = {}) {
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
      const target = join(directory, resource.target)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, data)
    }
    else {
      onProgress?.(`extracting ${label}`)
      await extractArchive(data, directory)
    }

    downloads.push({ resource, sha256: sha256(data) })
  }

  return downloads
}
