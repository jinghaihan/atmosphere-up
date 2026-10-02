import type { Release } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
import { getBundles } from '../../src/core/catalog'
import { resolveResources } from '../../src/core/plan'
import { getRelease } from '../../src/download'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

describe('resolveResources', () => {
  it('pairs DBI with the English translation from the same release', async () => {
    const files: Record<string, string[]> = {
      'meganukebmp/Switch_90DNS_tester': ['Switch_90DNS_tester.nro'],
      'Atmosphere-NX/Atmosphere': ['atmosphere-test.zip', 'fusee.bin'],
      'rashevskyv/dbi': ['DBI.nro', 'dbi.config'],
      'rashevskyv/DBIPatcher': ['DBI.nro', 'translation_en.bin', 'translation_zhcn.bin'],
      'CTCaer/hekate': ['hekate_ctcaer_6.5.4_Nyx_1.9.4.zip', 'hekate_ctcaer_6.5.4.bin'],
      'impeeza/Lockpick_RCMDecScots': ['Lockpick_RCM-1.9.20_Hekate.zip'],
      'ppkantorski/ovl-sysmodules': ['ovlSysmodules.ovl'],
      'impeeza/sys-patch': ['sys-patch.zip'],
      'ppkantorski/Ultrahand-Overlay': ['sdout.zip'],
    }
    vi.mocked(getRelease).mockImplementation(async repo => ({
      tag_name: repo === 'rashevskyv/DBIPatcher' ? '905' : 'latest',
      html_url: `https://github.com/${repo}/releases/latest`,
      assets: files[repo].map(name => ({ name })),
    } as Release))

    const resources = await resolveResources(getBundles()[0])
    const dbi = resources.filter(resource => resource.module === 'dbi')

    expect(dbi).toMatchObject([
      { release: '905', page: 'https://github.com/rashevskyv/DBIPatcher/releases/latest', asset: { name: 'DBI.nro' }, target: 'switch/DBI/DBI.nro' },
      { release: '905', page: 'https://github.com/rashevskyv/DBIPatcher/releases/latest', asset: { name: 'translation_en.bin' }, target: 'switch/DBI/translation.bin' },
      { asset: { name: 'dbi.config' }, target: 'switch/DBI/dbi.config' },
    ])
  })
})
