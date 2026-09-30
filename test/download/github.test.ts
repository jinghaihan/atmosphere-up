import type { Release } from '../../src/download'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadAsset, getRelease, selectAsset, sha256 } from '../../src/download'

afterEach(() => vi.unstubAllGlobals())

describe('selectAsset', () => {
  it('rejects missing or ambiguous release assets', () => {
    const release = { tag_name: 'v1', html_url: 'https://github.com/example/core/releases/v1', assets: [] } as Release
    expect(() => selectAsset(release, /zip$/)).toThrow('found 0')
    release.assets = ['a.zip', 'b.zip'].map(name => ({ name, browser_download_url: '', size: 1 }))
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })))
    await expect(getRelease('example/core')).rejects.toThrow('HTTP 403')
  })
})

describe('downloadAsset', () => {
  it('rejects an asset whose size or digest changed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response('test'))))
    const asset = { name: 'core.zip', size: 5, browser_download_url: 'https://github.com/example/core/releases/download/v1/core.zip' }
    await expect(downloadAsset(asset)).rejects.toThrow('Size mismatch')
    await expect(downloadAsset({ ...asset, size: 4, digest: 'sha256:invalid' })).rejects.toThrow('SHA-256 mismatch')
    const data = new TextEncoder().encode('test')
    expect(await downloadAsset({ ...asset, size: 4, digest: `sha256:${sha256(data)}` })).toEqual(data)
  })
})
