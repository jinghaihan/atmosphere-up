import type { ConfiguredExtension, Release } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRelease } from '../../src/download'
import { resolveConfiguredExtensions } from '../../src/extensions/configured'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

const extensions: ConfiguredExtension[] = [
  {
    name: 'mhgu-overlay',
    repository: 'jinghaihan/mhgu-overlay',
    assets: [
      { name: 'mhgu-overlay.ovl', target: 'switch/.overlays/mhgu-overlay.ovl' },
      { name: 'mhgu-overlay.ovl.sha256', target: 'config/mhgu-overlay/checksum.txt' },
    ],
    releaseTag: 'v0.6.0',
  },
  {
    name: 'feth-overlays',
    repository: '3096/feth-overlays',
    assets: [{ name: /^feth-overlays.*\.zip$/ }],
  },
]

beforeEach(() => {
  vi.mocked(getRelease).mockReset().mockImplementation(async (repository, tag) => ({
    tag_name: tag ?? 'latest',
    html_url: `https://github.com/${repository}/releases/latest`,
    assets: ['mhgu-overlay.ovl', 'mhgu-overlay.ovl.sha256', 'feth-overlays.zip'].map(name => ({ name })),
  } as Release))
})

describe('configured extensions', () => {
  it('resolves exact and patterned assets with pinned or latest releases', async () => {
    const resources = await resolveConfiguredExtensions(extensions)

    expect(vi.mocked(getRelease).mock.calls).toEqual([
      ['jinghaihan/mhgu-overlay', 'v0.6.0', undefined],
      ['3096/feth-overlays', undefined, undefined],
    ])
    expect(resources).toMatchObject([
      { module: 'mhgu-overlay', release: 'v0.6.0', asset: { name: 'mhgu-overlay.ovl' }, target: 'switch/.overlays/mhgu-overlay.ovl' },
      { module: 'mhgu-overlay', release: 'v0.6.0', asset: { name: 'mhgu-overlay.ovl.sha256' }, target: 'config/mhgu-overlay/checksum.txt' },
      { module: 'feth-overlays', asset: { name: 'feth-overlays.zip' }, target: undefined, directory: undefined },
    ])
  })

  it('reports a missing asset with its release page', async () => {
    await expect(resolveConfiguredExtensions([{ ...extensions[0], assets: [{ name: 'missing.ovl' }] }]))
      .rejects
      .toThrow('https://github.com/jinghaihan/mhgu-overlay/releases/latest; found 0')
  })

  it('stops resolving subsequent modules after cancellation', async () => {
    const controller = new AbortController()
    vi.mocked(getRelease).mockImplementationOnce(async () => {
      controller.abort()
      return { tag_name: 'v0.6.0', assets: [{ name: 'mhgu-overlay.ovl' }] } as Release
    })

    await expect(resolveConfiguredExtensions(extensions, { signal: controller.signal })).rejects.toThrow('aborted')
    expect(getRelease).toHaveBeenCalledTimes(1)
  })
})
