import type { Resource } from '../../src/core'
import { Buffer } from 'node:buffer'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'
import { join, resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getBundles } from '../../src/core'
import { downloadAsset } from '../../src/download'
import { buildUpgradePack } from '../../src/upgrade'
import { configureHorizonOcBootEntries } from '../../src/utils'

vi.mock('../../src/download', () => ({ downloadAsset: vi.fn() }))

const cwd = fileURLToPath(new URL('../..', import.meta.url))
const directory = join(cwd, 'test/fixtures/.generated/upgrade/pack')
const bundle = getBundles().find(bundle => bundle.labels.hos === '22.5.0')!

function resource(module: Resource['module'], name: string, target?: string): Resource {
  return {
    module,
    target,
    release: 'latest',
    page: 'https://github.com/example/releases/latest',
    asset: { name, size: 100, browser_download_url: `https://github.com/example/${name}` },
  } as Resource
}

beforeEach(() => {
  vi.mocked(downloadAsset).mockReset().mockImplementation(async asset => Buffer.from(asset.name))
})

afterEach(async () => {
  await rm(resolve(directory, '..'), { recursive: true, force: true })
})

describe('buildUpgradePack', () => {
  it.each([false, true])('outputs only DBI at the SD root with pack=%s', async (pack) => {
    const resources = [
      resource('dbi', 'DBI.nro', 'switch/DBI/DBI.nro'),
      resource('dbi', 'translation_en.bin', 'switch/DBI/translation.bin'),
      resource('dbi', 'dbi.config', 'switch/DBI/dbi.config'),
    ]

    await buildUpgradePack({ modules: ['dbi'], resources, directory: `${directory}${pack ? '.zip' : ''}`, pack })

    if (pack) {
      const archive = new AdmZip(`${directory}.zip`)
      expect(archive.readAsText('switch/DBI/DBI.nro')).toBe('DBI.nro')
      expect(archive.readAsText('switch/DBI/translation.bin')).toBe('translation_en.bin')
      expect(archive.getEntries().some(entry => entry.entryName.startsWith('atmosphere/'))).toBe(false)
      expect(archive.getEntry('pack/switch/DBI/DBI.nro')).toBeNull()
    }
    else {
      expect(await glob('**/*', { cwd: directory, onlyFiles: true })).toEqual(expect.arrayContaining([
        'switch/DBI/DBI.nro',
        'switch/DBI/translation.bin',
        'switch/DBI/dbi.config',
        'upgrade-manifest.json',
      ]))
      expect(await glob('atmosphere/**', { cwd: directory })).toEqual([])
    }
  })

  it('updates both Hekate payload locations and includes its defaults', async () => {
    const archive = new AdmZip()
    archive.addFile('bootloader/update.bin', Buffer.from('Hekate update'))
    vi.mocked(downloadAsset).mockResolvedValueOnce(archive.toBuffer()).mockResolvedValueOnce(Buffer.from('Hekate payload'))

    await buildUpgradePack({ modules: ['hekate'], resources: [
      resource('hekate', 'hekate.zip'),
      resource('hekate', 'hekate.bin', 'payload.bin'),
    ], directory })

    expect(await readFile(join(directory, 'atmosphere/reboot_payload.bin'), 'utf8')).toBe('Hekate payload')
    expect(await readFile(join(directory, 'payload.bin'), 'utf8')).toBe('Hekate payload')
    expect(await readFile(join(directory, 'bootloader/hekate_ipl.ini'))).toEqual(await readFile(join(cwd, 'assets/defaults/bootloader/hekate_ipl.ini')))
  })

  it.each([false, true])('includes JKSV backup and confirmation defaults with a JKSV-only upgrade and pack=%s', async (pack) => {
    await buildUpgradePack({
      modules: ['jksv'],
      resources: [resource('jksv', 'JKSV.nro', 'switch/JKSV/JKSV.nro')],
      directory: `${directory}${pack ? '.zip' : ''}`,
      pack,
    })

    if (pack) {
      const archive = new AdmZip(`${directory}.zip`)
      expect(JSON.parse(archive.readAsText('config/JKSV/JKSV.json'))).toEqual({
        ExportToZip: 0,
        HoldForDeletion: 0,
        HoldForRestoration: 0,
        HoldForOverWrite: 0,
      })
      expect(archive.readAsText('switch/JKSV/JKSV.nro')).toBe('JKSV.nro')
      expect(archive.getEntries().some(entry => entry.entryName.startsWith('atmosphere/'))).toBe(false)
    }
    else {
      expect(JSON.parse(await readFile(join(directory, 'config/JKSV/JKSV.json'), 'utf8'))).toEqual({
        ExportToZip: 0,
        HoldForDeletion: 0,
        HoldForRestoration: 0,
        HoldForOverWrite: 0,
      })
      expect(await readFile(join(directory, 'switch/JKSV/JKSV.nro'), 'utf8')).toBe('JKSV.nro')
      expect(await glob('atmosphere/**', { cwd: directory })).toEqual([])
    }
  })

  it('includes the required boot configuration for Horizon OC on its own', async () => {
    const hoc = resource('horizon-oc', 'hoc.kip', 'atmosphere/kips/hoc.kip')
    hoc.configure = async (staging) => {
      const path = join(staging, 'bootloader/hekate_ipl.ini')
      await writeFile(path, configureHorizonOcBootEntries(await readFile(path, 'utf8')))
    }

    await buildUpgradePack({ modules: ['horizon-oc'], resources: [hoc], directory })

    expect(await readFile(join(directory, 'bootloader/hekate_ipl.ini'), 'utf8')).toContain('kip1=atmosphere/kips/hoc.kip')
    expect(await glob('payload.bin', { cwd: directory })).toEqual([])
  })

  it('includes matching sigpatches and Atmosphere defaults without requiring a Hekate download', async () => {
    const archive = new AdmZip()
    archive.addFile('atmosphere/package3', Buffer.from('Atmosphere'))
    archive.addFile('hbmenu.nro', Buffer.from('hbmenu'))
    vi.mocked(downloadAsset).mockResolvedValueOnce(archive.toBuffer())

    await buildUpgradePack({ modules: ['atmosphere'], resources: [resource('atmosphere', 'atmosphere.zip')], bundle, directory })

    expect(await readFile(join(directory, 'atmosphere/package3'), 'utf8')).toBe('Atmosphere')
    expect(await readFile(join(directory, 'atmosphere/config/system_settings.ini'), 'utf8')).toContain('usb30_force_enabled')
    expect((await glob('**/*.ips', { cwd: directory })).length).toBeGreaterThan(0)
    expect(downloadAsset).toHaveBeenCalledTimes(1)
  })

  it('cleans staging after download cancellation', async () => {
    const controller = new AbortController()
    vi.mocked(downloadAsset).mockImplementationOnce(async () => {
      controller.abort()
      return Buffer.from('partial download')
    })

    await expect(buildUpgradePack({
      modules: ['dbi'],
      resources: [resource('dbi', 'DBI.nro', 'switch/DBI/DBI.nro')],
      directory,
      signal: controller.signal,
    })).rejects.toThrow('aborted')

    expect(await glob('*', { cwd: resolve(directory, '..'), dot: true, onlyFiles: false })).toEqual([])
  })
})
