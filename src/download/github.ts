import type { ReleaseAsset } from '../types'
import process from 'node:process'
import { Octokit } from '@octokit/rest'
import { sha256 } from '../utils'

const github = new Octokit({ auth: process.env.GITHUB_TOKEN })

export async function getRelease(repository: string, tag?: string) {
  const [owner, repo] = repository.split('/')
  const response = tag
    ? await github.rest.repos.getReleaseByTag({ owner, repo, tag })
    : await github.rest.repos.getLatestRelease({ owner, repo })
  return response.data
}

export async function downloadAsset(repository: string, asset: ReleaseAsset): Promise<Uint8Array> {
  const [owner, repo] = repository.split('/')
  const response = await github.rest.repos.getReleaseAsset({
    owner,
    repo,
    asset_id: asset.id,
    headers: { accept: 'application/octet-stream' },
    request: { parseSuccessResponseBody: false },
  })
  const data = new Uint8Array(await new Response(response.data as unknown as ReadableStream).arrayBuffer())
  if (data.byteLength !== asset.size)
    throw new Error(`Size mismatch for ${asset.name}. Expected ${asset.size}, received ${data.byteLength}.`)
  if (asset.digest?.startsWith('sha256:') && asset.digest.slice(7) !== sha256(data))
    throw new Error(`SHA-256 mismatch for ${asset.name}.`)
  return data
}
