import type { Resource } from '../core/plan'
import type { ConfiguredExtension, TaskOptions } from '../types'
import { getRelease } from '../download'
import { selectAsset } from '../utils'

export async function resolveConfiguredExtensions(extensions: ConfiguredExtension[], { signal, onProgress }: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const extension of extensions) {
    signal?.throwIfAborted()

    onProgress?.(`resolving ${extension.name} (${extension.releaseTag || 'latest'})`)
    const release = await getRelease(extension.repository, extension.releaseTag, signal)

    for (const asset of extension.assets) {
      signal?.throwIfAborted()

      resources.push({
        module: extension.name,
        release: release.tag_name,
        page: release.html_url,
        asset: selectAsset(release, asset.name),
        target: asset.target,
        directory: asset.directory,
      })
    }
  }

  return resources
}
