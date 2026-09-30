import type { Release } from '../../src/types'
import { Buffer } from 'node:buffer'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import AdmZip from 'adm-zip'
import { parse } from 'ini'
import { join } from 'pathe'
import { describe, expect, it, vi } from 'vitest'
import { installResources } from '../../src/core/install'
import { downloadAsset, getRelease, getRepositoryFile } from '../../src/download'
import { resolvePerformanceTuning } from '../../src/extensions'

vi.mock('../../src/download', () => ({ getRelease: vi.fn(), getRepositoryFile: vi.fn(), downloadAsset: vi.fn() }))

const releases = {
  'retronx-team/sys-clk': ['sys-clk-2.0.1-21fix.zip'],
  'ppkantorski/sys-clk': ['sys-clk-overlay.ovl', 'lang.zip'],
  'Horizon-OC/Horizon-OC': ['dist.zip', 'dist_ext.zip'],
  'masagrator/FPSLocker': ['FPSLocker.ovl', 'Debug.zip'],
  'masagrator/ReverseNX-RT': ['ReverseNX-RT-ovl.ovl'],
  'masagrator/SaltyNX': ['SaltyNX.zip', 'SaltyNX_Debug.zip'],
  'averne/Fizeau': ['Fizeau-2.8.3-5bf3f0d.zip'],
}

vi.mocked(getRelease).mockImplementation(async repository => ({
  tag_name: 'v1',
  html_url: `https://github.com/${repository}/releases/v1`,
  assets: releases[repository as keyof typeof releases].map(name => ({ name })),
}) as Release)
vi.mocked(getRepositoryFile).mockResolvedValue('1.11.2\n')

describe('resolvePerformanceTuning', () => {
  it('installs Fizeau independently without clock or FPS services', async () => {
    const resources = await resolvePerformanceTuning(['fizeau'])

    expect(resources).toMatchObject([{ module: 'fizeau', asset: { name: 'Fizeau-2.8.3-5bf3f0d.zip' } }])
    expect(resources).toHaveLength(1)
    expect(resources[0].target).toBeUndefined()
    expect(resources[0].paths).toBeUndefined()
  })

  it('installs the enhanced overlay after the clock service and adds SaltyNX only once', async () => {
    const resources = await resolvePerformanceTuning(['reverse-nx-rt', 'sys-clk-overlay-ultrahand', 'fps-locker', 'sys-clk'])

    expect(resources.map(resource => resource.module)).toEqual(['sys-clk', 'sys-clk-overlay-ultrahand', 'salty-nx', 'fps-locker', 'reverse-nx-rt'])
    expect(resources.map(resource => resource.asset.name)).toEqual(['sys-clk-2.0.1-21fix.zip', 'sys-clk-overlay.ovl', 'SaltyNX.zip', 'FPSLocker.ovl', 'ReverseNX-RT-ovl.ovl'])
    expect(resources[0].paths).toEqual(['atmosphere/', 'config/', 'switch/sys-clk-manager.nro'])
    expect(resources[1].target).toBe('switch/.overlays/sys-clk-overlay.ovl')
  })

  it('includes a clock service when only the Ultrahand frontend is selected', async () => {
    const resources = await resolvePerformanceTuning(['sys-clk-overlay-ultrahand'])

    expect(resources.map(resource => resource.module)).toEqual(['sys-clk', 'sys-clk-overlay-ultrahand'])
  })

  it('retains the original overlay when the enhanced overlay is not selected', async () => {
    const resources = await resolvePerformanceTuning(['sys-clk'])

    expect(resources[0].paths).toEqual(['atmosphere/', 'config/', 'switch/'])
  })

  it('allows HOC and Sys Clk together and excludes bundled monitoring tools', async () => {
    const resources = await resolvePerformanceTuning(['horizon-oc', 'sys-clk', 'sys-clk-overlay-ultrahand'], { atmosphere: '1.11.2' })

    expect(resources.map(resource => resource.module)).toEqual(['sys-clk', 'horizon-oc', 'sys-clk-overlay-ultrahand'])
    expect(resources[1]).toMatchObject({
      asset: { name: 'dist.zip' },
      paths: ['atmosphere/', 'config/', 'switch/.overlays/horizon-oc-overlay.ovl'],
    })
  })

  it('rejects a HOC release built for a different Atmosphere version', async () => {
    await expect(resolvePerformanceTuning(['horizon-oc'], { atmosphere: '1.10.2' })).rejects.toThrow('requires Atmosphere 1.11.2')
    expect(getRepositoryFile).toHaveBeenLastCalledWith({ repository: 'Horizon-OC/Horizon-OC', path: 'ams_ver.txt', ref: 'v1', signal: undefined })
  })

  it('uses HOC as the dependency for its compatible overlay without adding the original service', async () => {
    const resources = await resolvePerformanceTuning(['sys-clk-overlay-ultrahand', 'horizon-oc'], { atmosphere: '1.11.2' })

    expect(resources.map(resource => resource.module)).toEqual(['horizon-oc', 'sys-clk-overlay-ultrahand'])
  })

  it('installs HOC and updates CFW boot entries while preserving stock and excluding Status Monitor', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'atmosphere-up-performance-'))
    const archive = new AdmZip()
    archive.addFile('atmosphere/kips/hoc.kip', Buffer.from('kip'))
    archive.addFile('atmosphere/exosphere.bin', Buffer.from('exosphere'))
    archive.addFile('config/horizon-oc/config.ini.template', Buffer.from('settings'))
    archive.addFile('switch/.overlays/horizon-oc-overlay.ovl', Buffer.from('hoc'))
    archive.addFile('switch/.overlays/Status-Monitor-Overlay.ovl', Buffer.from('monitor'))
    vi.mocked(downloadAsset).mockResolvedValueOnce(archive.toBuffer())

    try {
      await mkdir(join(directory, 'bootloader'))
      await writeFile(join(directory, 'bootloader/hekate_ipl.ini'), '[config]\nautoboot=0\n\n[custom cfw]\npkg3=atmosphere/package3\n\n[custom stock]\npkg3=atmosphere/package3\nstock=1\n')

      await installResources(await resolvePerformanceTuning(['horizon-oc'], { atmosphere: '1.11.2' }), directory)

      const settings = parse(await readFile(join(directory, 'bootloader/hekate_ipl.ini'), 'utf8'))
      expect(settings['custom cfw']).toEqual({ pkg3: 'atmosphere/package3', kip1: 'atmosphere/kips/hoc.kip', secmon: 'atmosphere/exosphere.bin' })
      expect(settings['custom stock']).toEqual({ pkg3: 'atmosphere/package3', stock: '1' })
      expect(settings.config).toEqual({ autoboot: '0' })
      expect(await readFile(join(directory, 'switch/.overlays/horizon-oc-overlay.ovl'), 'utf8')).toBe('hoc')
      await expect(readFile(join(directory, 'switch/.overlays/Status-Monitor-Overlay.ovl'))).rejects.toThrow()
    }
    finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
