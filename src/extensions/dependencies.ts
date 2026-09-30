import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { selectAsset } from '../utils'

export async function resolveSaltyNx({ signal, onProgress }: TaskOptions = {}): Promise<Resource> {
  signal?.throwIfAborted()

  onProgress?.('resolving salty-nx (latest)')
  const release = await getRelease(EXTENSION_REPO_CONFIG['salty-nx'], undefined, signal)

  return {
    module: 'salty-nx',
    release: release.tag_name,
    page: release.html_url,
    asset: selectAsset(release, /^SaltyNX\.zip$/),
  }
}
