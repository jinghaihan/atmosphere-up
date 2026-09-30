import type { Release } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
import { getRelease } from '../../src/download'
import { resolveSaveManagement } from '../../src/extensions'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

describe('resolveSaveManagement', () => {
  it.each([
    ['jksv', 'J-D-K/JKSV', 'JKSV.nro'],
    ['checkpoint', 'BernardoGiordano/Checkpoint', 'Checkpoint.nro'],
  ] as const)('installs only the Switch NRO for %s', async (module, repository, name) => {
    vi.mocked(getRelease).mockResolvedValueOnce({
      tag_name: 'v1',
      html_url: 'https://github.com/example/releases/v1',
      assets: [{ name: 'Checkpoint.3dsx' }, { name: 'checkpoint.cia' }, { name }],
    } as Release)

    const resource = await resolveSaveManagement(module)

    expect(getRelease).toHaveBeenLastCalledWith(repository, undefined, undefined)
    expect(resource).toMatchObject({ module, asset: { name }, target: `switch/${name.slice(0, -4)}/${name}` })
  })
})
