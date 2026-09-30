import { createHash } from 'node:crypto'
import process from 'node:process'

export interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
  digest?: string | null
}

export interface Release {
  tag_name: string
  html_url: string
  assets: ReleaseAsset[]
}

export async function getRelease(repo: string, tag?: string): Promise<Release> {
  const endpoint = tag ? `tags/${encodeURIComponent(tag)}` : 'latest'
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'atmosphere-up',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/${endpoint}`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok)
    throw new Error(`Cannot resolve ${repo} ${tag || 'latest'}: HTTP ${response.status}. Check the release and GitHub API rate limit.`)

  const release = await response.json() as Release
  if (!release.tag_name || !Array.isArray(release.assets))
    throw new Error(`Invalid release response from ${repo}.`)
  return release
}

export function selectAsset(release: Release, pattern: RegExp): ReleaseAsset {
  const matches = release.assets.filter(asset => pattern.test(asset.name))
  if (matches.length !== 1)
    throw new Error(`Expected one asset matching ${pattern} in ${release.html_url}; found ${matches.length}.`)
  return matches[0]
}

export async function downloadAsset(asset: ReleaseAsset): Promise<Uint8Array> {
  const response = await fetch(asset.browser_download_url, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok)
    throw new Error(`Cannot download ${asset.name}: HTTP ${response.status}.`)
  const data = new Uint8Array(await response.arrayBuffer())
  if (data.byteLength !== asset.size)
    throw new Error(`Size mismatch for ${asset.name}. Expected ${asset.size}, received ${data.byteLength}.`)
  if (asset.digest?.startsWith('sha256:') && asset.digest.slice(7) !== sha256(data))
    throw new Error(`SHA-256 mismatch for ${asset.name}.`)
  return data
}

export function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}
