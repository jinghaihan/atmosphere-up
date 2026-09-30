import type { ReleaseAsset } from '../types'
import process from 'node:process'
import { Octokit } from '@octokit/rest'
import { sha256 } from '../utils'

const github = new Octokit({ auth: process.env.GITHUB_TOKEN })

interface DownloadOptions {
  signal?: AbortSignal
  onProgress?: (received: number) => void
}

export async function getRelease(repository: string, tag?: string, signal?: AbortSignal) {
  signal?.throwIfAborted()
  const [owner, repo] = repository.split('/')
  const response = tag
    ? await github.rest.repos.getReleaseByTag({ owner, repo, tag, request: { signal } })
    : await github.rest.repos.getLatestRelease({ owner, repo, request: { signal } })
  return response.data
}

export async function downloadAsset(repository: string, asset: ReleaseAsset, { signal, onProgress }: DownloadOptions = {}): Promise<Uint8Array> {
  signal?.throwIfAborted()
  const [owner, repo] = repository.split('/')
  const response = await github.rest.repos.getReleaseAsset({
    owner,
    repo,
    asset_id: asset.id,
    headers: { accept: 'application/octet-stream' },
    request: { parseSuccessResponseBody: false, signal },
  })
  let received = 0
  const stream = response.data as unknown as ReadableStream<Uint8Array>
  const tracked = stream.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      received += chunk.byteLength
      onProgress?.(received)
      controller.enqueue(chunk)
    },
  }), { signal })
  const data = new Uint8Array(await new Response(tracked).arrayBuffer())
  signal?.throwIfAborted()
  if (data.byteLength !== asset.size)
    throw new Error(`Size mismatch for ${asset.name}. Expected ${asset.size}, received ${data.byteLength}.`)
  if (asset.digest?.startsWith('sha256:') && asset.digest.slice(7) !== sha256(data))
    throw new Error(`SHA-256 mismatch for ${asset.name}.`)
  return data
}
