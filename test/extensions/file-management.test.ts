import type { Release } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
import { getRelease } from '../../src/download'
import { resolveFileManagement } from '../../src/extensions'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

describe('resolveFileManagement', () => {
  it('installs the NX-Shell NRO in its own directory', async () => {
    vi.mocked(getRelease).mockResolvedValueOnce({
      tag_name: '4.02',
      html_url: 'https://github.com/DefenderOfHyrule/NX-Shell/releases/tag/4.02',
      assets: [{ name: 'NX-Shell.nro' }, { name: 'source.zip' }],
    } as Release)

    const [resource] = await resolveFileManagement(['nx-shell'])

    expect(getRelease).toHaveBeenCalledWith('DefenderOfHyrule/NX-Shell', undefined, undefined)
    expect(resource).toMatchObject({
      module: 'nx-shell',
      release: '4.02',
      asset: { name: 'NX-Shell.nro' },
      target: 'switch/NX-Shell/NX-Shell.nro',
    })
  })
})
