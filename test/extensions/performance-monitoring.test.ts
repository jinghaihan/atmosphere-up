import type { Resource } from '../../src/core'
import type { Release } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
import { getRelease } from '../../src/download'
import { resolvePerformanceMonitoring } from '../../src/extensions'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

describe('resolvePerformanceMonitoring', () => {
  it.each([false, true])('shares the SaltyNX dependency when already resolved=%s', async (existing) => {
    vi.mocked(getRelease).mockClear()
    vi.mocked(getRelease).mockImplementation(async repository => ({
      tag_name: 'v1',
      assets: [{ name: repository === 'masagrator/SaltyNX' ? 'SaltyNX.zip' : 'Status-Monitor-Overlay.ovl' }],
    }) as Release)

    const resources = await resolvePerformanceMonitoring(['status-monitor'], {
      resources: existing ? [{ module: 'salty-nx' } as Resource] : [],
    })

    expect(resources.map(resource => resource.module)).toEqual(existing ? ['status-monitor'] : ['salty-nx', 'status-monitor'])
    expect(getRelease).toHaveBeenCalledTimes(existing ? 1 : 2)
  })

  it('uses the maintained fork and installs its overlay', async () => {
    vi.mocked(getRelease).mockResolvedValueOnce({ tag_name: 'v1', assets: [{ name: 'Status-Monitor-Overlay.ovl' }, { name: 'lang.zip' }] } as Release)

    const [resource] = await resolvePerformanceMonitoring(['status-monitor'], { resources: [{ module: 'salty-nx' } as Resource] })

    expect(getRelease).toHaveBeenLastCalledWith('ppkantorski/Status-Monitor-Overlay', undefined, undefined)
    expect(resource).toMatchObject({ module: 'status-monitor', asset: { name: 'Status-Monitor-Overlay.ovl' }, target: 'switch/.overlays/Status-Monitor-Overlay.ovl' })
  })

  it('installs the complete Deux archive with its layouts and service definitions', async () => {
    vi.mocked(getRelease).mockResolvedValueOnce({ tag_name: 'v2', assets: [{ name: 'Status-Monitor-Deux.zip' }, { name: 'ZDebug.zip' }] } as Release)

    const [resource] = await resolvePerformanceMonitoring(['status-monitor-deux'], { resources: [{ module: 'salty-nx' } as Resource] })

    expect(getRelease).toHaveBeenLastCalledWith('masagrator/Status-Monitor-Deux', undefined, undefined)
    expect(resource).toMatchObject({ module: 'status-monitor-deux', asset: { name: 'Status-Monitor-Deux.zip' }, target: undefined })
    expect(resource.paths).toBeUndefined()
  })
})
