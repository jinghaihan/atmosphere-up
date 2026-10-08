import type { Release } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBundles } from '../../src/core'
import { getRelease } from '../../src/download'
import { resolveUpgradeResources } from '../../src/upgrade'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

const files: Record<string, string[]> = {
  'rashevskyv/dbi': ['DBI.nro', 'dbi.config'],
  'rashevskyv/DBIPatcher': ['DBI.nro', 'translation_en.bin'],
  'J-D-K/JKSV': ['JKSV.nro'],
  'masagrator/SaltyNX': ['SaltyNX.zip'],
  'masagrator/FPSLocker': ['FPSLocker.ovl'],
  'ppkantorski/Status-Monitor-Overlay': ['Status-Monitor-Overlay.ovl'],
  'ndeadly/MissionControl': ['MissionControl-0.15.2.zip'],
  'jinghaihan/mhgu-overlay': ['mhgu-overlay.ovl', 'mhgu-overlay.ovl.sha256'],
  '3096/feth-overlays': ['feth-overlays.zip'],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getRelease).mockImplementation(async repo => ({
    tag_name: 'latest',
    html_url: `https://github.com/${repo}/releases/latest`,
    assets: files[repo].map(name => ({ name })),
  } as Release))
})

describe('resolveUpgradeResources', () => {
  it('resolves only selected configured modules and leaves them out of a DBI-only upgrade', async () => {
    const extensions = [
      { name: 'mhgu-overlay', repository: 'jinghaihan/mhgu-overlay', assets: [{ name: 'mhgu-overlay.ovl', target: 'switch/.overlays/mhgu-overlay.ovl' }] },
      { name: 'feth-overlays', repository: '3096/feth-overlays', assets: [{ name: 'feth-overlays.zip' }] },
    ]

    const resources = await resolveUpgradeResources(['mhgu-overlay'], { extensions })
    expect(resources).toMatchObject([{ module: 'mhgu-overlay', target: 'switch/.overlays/mhgu-overlay.ovl' }])
    expect(vi.mocked(getRelease).mock.calls.map(([repository]) => repository)).toEqual(['jinghaihan/mhgu-overlay'])

    vi.clearAllMocks()
    await resolveUpgradeResources(['dbi'], { extensions })
    expect(vi.mocked(getRelease).mock.calls.map(([repository]) => repository)).toEqual(['rashevskyv/dbi', 'rashevskyv/DBIPatcher'])
  })

  it('resolves only the selected DBI and JKSV modules without requiring HOS', async () => {
    const resources = await resolveUpgradeResources(['dbi', 'jksv'])

    expect(vi.mocked(getRelease).mock.calls.map(([repo]) => repo)).toEqual([
      'rashevskyv/dbi',
      'rashevskyv/DBIPatcher',
      'J-D-K/JKSV',
    ])
    expect(resources.map(resource => resource.target)).toEqual([
      'switch/DBI/DBI.nro',
      'switch/DBI/translation.bin',
      'switch/DBI/dbi.config',
      'switch/JKSV/JKSV.nro',
    ])
  })

  it.each([false, true])('deduplicates shared SaltyNX with explicit selection=%s', async (explicit) => {
    const resources = await resolveUpgradeResources(['fps-locker', 'status-monitor', ...explicit ? ['salty-nx' as const] : []])

    expect(resources.filter(resource => resource.module === 'salty-nx')).toHaveLength(1)
    expect(vi.mocked(getRelease).mock.calls.filter(([repo]) => repo === 'masagrator/SaltyNX')).toHaveLength(1)
  })

  it('uses the selected HOS mapping for Mission Control', async () => {
    const bundle = getBundles().find(bundle => bundle.labels.hos === '22.5.0')!

    await resolveUpgradeResources(['mission-control'], { bundle })

    expect(getRelease).toHaveBeenCalledWith('ndeadly/MissionControl', 'v0.15.2', undefined)
  })

  it('does not query GitHub for bundled sigpatches alone', async () => {
    const resources = await resolveUpgradeResources(['sigpatches'])

    expect(resources).toEqual([])
    expect(getRelease).not.toHaveBeenCalled()
  })
})
