import type { Release, ReleaseAsset } from '../../src/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadAsset, getRelease } from '../../src/download'
import { selectAsset, sha256 } from '../../src/utils'

afterEach(() => vi.unstubAllGlobals())

describe('selectAsset', () => {
  it('rejects missing or ambiguous release assets', () => {
    const release = { tag_name: 'v1', html_url: 'https://github.com/example/core/releases/v1', assets: [] } as unknown as Release
    expect(() => selectAsset(release, /zip$/)).toThrow('found 0')
    release.assets = ['a.zip', 'b.zip'].map(name => ({ name, browser_download_url: '', size: 1 })) as ReleaseAsset[]
    expect(() => selectAsset(release, /zip$/)).toThrow('found 2')
  })
})

describe('getRelease', () => {
  it('resolves the exact prerelease tag instead of latest', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ tag_name: '1.6.1-prerelease', assets: [] }))
    vi.stubGlobal('fetch', fetch)
    await getRelease('Atmosphere-NX/Atmosphere', '1.6.1-prerelease')
    expect(fetch.mock.calls[0][0]).toBe('https://api.github.com/repos/Atmosphere-NX/Atmosphere/releases/tags/1.6.1-prerelease')
  })

  it('reports an API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'API rate limit exceeded' }, { status: 403 })))
    await expect(getRelease('example/core')).rejects.toThrow('API rate limit exceeded')
  })
})

describe('downloadAsset', () => {
  it('rejects an asset whose size or digest changed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response('test'))))
    const asset = { id: 1, name: 'core.zip', size: 5, browser_download_url: 'https://github.com/example/core/releases/download/v1/core.zip' } as ReleaseAsset
    await expect(downloadAsset('example/core', asset)).rejects.toThrow('Size mismatch')
    await expect(downloadAsset('example/core', { ...asset, size: 4, digest: 'sha256:invalid' })).rejects.toThrow('SHA-256 mismatch')
    const data = new TextEncoder().encode('test')
    expect(await downloadAsset('example/core', { ...asset, size: 4, digest: `sha256:${sha256(data)}` })).toEqual(data)
  })
})
