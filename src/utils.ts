import type { Bundle } from './core/catalog'
import type { Release, ReleaseAsset } from './types'
import { createHash } from 'node:crypto'
import { isAbsolute, relative } from 'pathe'

export function isParentDirectory(parent: string, child: string): boolean {
  const path = relative(parent, child)
  return !path || (!isAbsolute(path) && path !== '..' && !path.startsWith('../'))
}

export function getOutputName(bundle: Bundle): string {
  return `atmosphere-${bundle.labels.atmosphere}-hos-${bundle.labels.hos}`
}

export function selectAsset(release: Release, pattern: RegExp): ReleaseAsset {
  const matches = release.assets.filter(asset => pattern.test(asset.name))
  if (matches.length !== 1)
    throw new Error(`Expected one asset matching ${pattern} in ${release.html_url}; found ${matches.length}.`)
  return matches[0]
}

export function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}
