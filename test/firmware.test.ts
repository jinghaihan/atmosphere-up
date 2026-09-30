import type { Release } from '../src/types'
import { describe, expect, it, vi } from 'vitest'
import { getRelease } from '../src/download'
import { resolveFirmware } from '../src/firmware'

vi.mock('../src/download', () => ({ getRelease: vi.fn() }))

describe('resolveFirmware', () => {
  it.each(['18.0.0', '22.0.0'])('downloads the exact firmware release for HOS %s', async (hos) => {
    vi.mocked(getRelease).mockResolvedValueOnce({
      tag_name: hos,
      html_url: `https://github.com/THZoria/NX_Firmware/releases/tag/${hos}`,
      assets: [{ name: `Firmware.${hos}.zip` }, { name: 'checksums.txt' }],
    } as Release)
    const controller = new AbortController()

    const resource = await resolveFirmware(hos, { signal: controller.signal })

    expect(getRelease).toHaveBeenLastCalledWith('THZoria/NX_Firmware', hos, controller.signal)
    expect(resource).toMatchObject({
      module: 'firmware',
      release: hos,
      asset: { name: `Firmware.${hos}.zip` },
      directory: `firmware/${hos}`,
    })
  })
})
