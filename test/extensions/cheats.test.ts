import type { Release } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
import { getRelease } from '../../src/download'
import { resolveCheats } from '../../src/extensions'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

describe('resolveCheats', () => {
  it('resolves only the selected overlays without requiring the NRO tools', async () => {
    vi.mocked(getRelease)
      .mockResolvedValueOnce({ tag_name: 'v1', assets: [{ name: 'ovlEdiZon.ovl' }, { name: 'EdiZon-Overlay.zip' }] } as Release)
      .mockResolvedValueOnce({ tag_name: 'v2', assets: [{ name: 'breezehand.zip' }] } as Release)

    const resources = await resolveCheats(['edizon-overlay', 'breezehand'])

    expect(vi.mocked(getRelease).mock.calls.map(([repository]) => repository)).toEqual(['proferabg/EdiZon-Overlay', 'tomvita/Breezehand-Overlay'])
    expect(resources).toMatchObject([
      { module: 'edizon-overlay', asset: { name: 'ovlEdiZon.ovl' }, target: 'switch/.overlays/ovlEdiZon.ovl' },
      { module: 'breezehand', paths: ['switch/.overlays/breezehand.ovl', 'config/breezehand/'] },
    ])
  })

  it.each([
    ['edizon-se', 'tomvita/EdiZon-SE', 'edizon.zip', 'EdiZon_alt.zip', 'switch/edizon/'],
    ['breeze', 'tomvita/Breeze-Beta', 'Breeze.zip', 'version.txt', 'switch/breeze/'],
  ] as const)('selects the regular %s archive and only its application directory', async (module, repository, name, otherAsset, path) => {
    vi.mocked(getRelease)
      .mockResolvedValueOnce({ tag_name: 'v2', assets: [{ name }, { name: otherAsset }] } as Release)

    const resources = await resolveCheats([module])

    expect(getRelease).toHaveBeenLastCalledWith(repository, undefined, undefined)
    expect(resources).toMatchObject([
      { module, asset: { name }, paths: [path] },
    ])
  })
})
