import type { Bundle } from './core/catalog'
import type { Release, ReleaseAsset } from './types'
import { createHash } from 'node:crypto'
import { parse, stringify } from 'ini'
import { isAbsolute, relative, resolve } from 'pathe'

export function isParentDirectory(parent: string, child: string): boolean {
  const path = relative(parent, child)

  return !path || (!isAbsolute(path) && path !== '..' && !path.startsWith('../'))
}

export function getOutputName(bundle: Bundle): string {
  return `atmosphere-${bundle.labels.atmosphere}-hos-${bundle.labels.hos}`
}

export function getOutputPath(bundle: Bundle, directory: string, pack = false): string {
  return resolve(directory, `${getOutputName(bundle)}${pack ? '.zip' : ''}`)
}

export function formatDownloadProgress(received: number, total: number): string {
  return `${(received / 1024 ** 2).toFixed(1)} / ${(total / 1024 ** 2).toFixed(1)} MiB (${Math.floor(received / total * 100)}%)`
}

export function getRepositoryUrl(repository: string): string {
  return `https://github.com/${repository}`
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

export function configureHorizonOcBootEntries(content: string): string {
  const settings = parse(content)

  for (const entry of Object.values(settings)) {
    if (typeof entry !== 'object' || !entry.pkg3 || String(entry.stock) === '1')
      continue

    entry.kip1 = 'atmosphere/kips/hoc.kip'
    entry.secmon = 'atmosphere/exosphere.bin'
  }

  return stringify(settings, { whitespace: false })
}
