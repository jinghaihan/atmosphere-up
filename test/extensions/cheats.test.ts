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

  it('selects the Breeze archive and only its application directory', async () => {
    vi.mocked(getRelease)
      .mockResolvedValueOnce({ tag_name: 'v2', assets: [{ name: 'Breeze.zip' }, { name: 'version.txt' }] } as Release)

    const resources = await resolveCheats(['breeze'])

    expect(resources).toMatchObject([
      { module: 'breeze', asset: { name: 'Breeze.zip' }, paths: ['switch/breeze/'] },
    ])
  })
})
