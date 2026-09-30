import type { Release } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
import { getRelease } from '../../src/download'
import { resolvePerformanceMonitoring } from '../../src/extensions'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

describe('resolvePerformanceMonitoring', () => {
  it('uses the maintained fork and installs its overlay', async () => {
    vi.mocked(getRelease).mockResolvedValueOnce({ tag_name: 'v1', assets: [{ name: 'Status-Monitor-Overlay.ovl' }, { name: 'lang.zip' }] } as Release)

    const resource = await resolvePerformanceMonitoring('status-monitor')

    expect(getRelease).toHaveBeenLastCalledWith('ppkantorski/Status-Monitor-Overlay', undefined, undefined)
    expect(resource).toMatchObject({ module: 'status-monitor', asset: { name: 'Status-Monitor-Overlay.ovl' }, target: 'switch/.overlays/Status-Monitor-Overlay.ovl' })
  })

  it('installs the complete Deux archive with its layouts and service definitions', async () => {
    vi.mocked(getRelease).mockResolvedValueOnce({ tag_name: 'v2', assets: [{ name: 'Status-Monitor-Deux.zip' }, { name: 'ZDebug.zip' }] } as Release)

    const resource = await resolvePerformanceMonitoring('status-monitor-deux')

    expect(getRelease).toHaveBeenLastCalledWith('masagrator/Status-Monitor-Deux', undefined, undefined)
    expect(resource).toMatchObject({ module: 'status-monitor-deux', asset: { name: 'Status-Monitor-Deux.zip' }, target: undefined })
    expect(resource.paths).toBeUndefined()
  })
})
