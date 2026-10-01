import type { Resource } from '../../src/core'
import { Buffer } from 'node:buffer'
import { readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'
import { parse } from 'ini'
import { join, resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildPack, getBundles } from '../../src/core'
import { downloadAsset } from '../../src/download'

vi.mock('../../src/download', () => ({ downloadAsset: vi.fn() }))

const cwd = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const directory = join(cwd, 'test/fixtures/.generated/build')
const bundle = getBundles().find(bundle => bundle.labels.hos === '21.2.0')!
const resource = {
  module: 'ultrahand',
  release: 'v2',
  page: 'https://github.com/example/core/releases/v2',
  asset: { name: 'core.zip', browser_download_url: 'https://github.com/example/core/releases/download/v2/core.zip' },
} as Resource

afterEach(async () => {
  vi.clearAllMocks()
  await rm(directory, { recursive: true, force: true })
  await rm(`${directory}.zip`, { force: true })
})

describe('buildPack', () => {
  it('selects firmware after installing extensions and compresses only after installing firmware', async () => {
    const extension = {
      ...resource,
      module: 'jksv',
      asset: { ...resource.asset, name: 'JKSV.nro' },
      target: 'switch/JKSV/JKSV.nro',
    } as Resource
    const fileManager = {
      ...extension,
      module: 'nx-shell',
      asset: { ...resource.asset, name: 'NX-Shell.nro' },
      target: 'switch/NX-Shell/NX-Shell.nro',
    } as Resource
    const data = new TextEncoder().encode('save manager')
    const fileManagerData = new TextEncoder().encode('file manager')
    const firmwareArchive = new AdmZip()
    firmwareArchive.addFile('system.cnmt.nca', Buffer.from('firmware'))
    const firmware = {
      ...resource,
      module: 'firmware',
      asset: { ...resource.asset, name: `Firmware.${bundle.labels.hos}.zip` },
      directory: `firmware/${bundle.labels.hos}`,
    } as Resource
    vi.mocked(downloadAsset)
      .mockResolvedValueOnce(await readFile(join(cwd, 'test/fixtures/core.zip')))
      .mockResolvedValueOnce(data)
      .mockResolvedValueOnce(fileManagerData)
      .mockResolvedValueOnce(firmwareArchive.toBuffer())
    const onProgress = vi.fn()

    await buildPack({ bundle, resources: [resource], directory: `${directory}.zip`, pack: true, onProgress, onCoreReady: async () => {
      expect(downloadAsset).toHaveBeenCalledTimes(1)
      expect(onProgress.mock.lastCall).toEqual(['setting Hekate reboot payload'])
      const [settings] = await glob('.atmosphere-up-*/pack/config/ultrahand/config.ini', { cwd: resolve(directory, '..'), dot: true, absolute: true })
      expect(await readFile(settings, 'utf8')).toContain('L+DDOWN')
      return [extension, fileManager]
    }, onExtensionsReady: async () => {
      expect(downloadAsset).toHaveBeenCalledTimes(3)
      expect(onProgress.mock.lastCall).toEqual(['installing nx-shell [2/2]'])
      return [firmware]
    } })

    const archive = new AdmZip(`${directory}.zip`)
    expect(archive.readFile(extension.target!)).toEqual(Buffer.from(data))
    expect(archive.readFile(fileManager.target!)).toEqual(Buffer.from(fileManagerData))
    expect(archive.readAsText(`firmware/${bundle.labels.hos}/system.cnmt.nca`)).toBe('firmware')
    expect(archive.getEntry('system.cnmt.nca')).toBeNull()
    expect(JSON.parse(archive.readAsText('pack-manifest.json')).resources.map((item: Resource) => item.module)).toEqual(['ultrahand', 'jksv', 'nx-shell', 'firmware'])
    const messages = onProgress.mock.calls.map(([message]) => message)
    expect(messages.indexOf('compressing pack into ZIP')).toBeGreaterThan(messages.indexOf('extracting firmware [1/1]'))
  })

  it('cleans up the assembled components when firmware selection is cancelled', async () => {
    vi.mocked(downloadAsset).mockResolvedValueOnce(await readFile(join(cwd, 'test/fixtures/core.zip')))
    const controller = new AbortController()

    await expect(buildPack({
      bundle,
      resources: [resource],
      directory,
      signal: controller.signal,
      onExtensionsReady: async () => {
        controller.abort()
        throw controller.signal.reason
      },
    })).rejects.toThrow('aborted')

    expect(await glob(['.atmosphere-up-*', 'build'], { cwd: resolve(directory, '..'), dot: true, onlyFiles: false })).toEqual([])
  })

  it('cleans up the assembled core when the extension prompts are cancelled', async () => {
    vi.mocked(downloadAsset).mockResolvedValueOnce(await readFile(join(cwd, 'test/fixtures/core.zip')))
    const controller = new AbortController()

    await expect(buildPack({ bundle, resources: [resource], directory: `${directory}.zip`, pack: true, signal: controller.signal, onCoreReady: async () => {
      controller.abort()
      throw controller.signal.reason
    } })).rejects.toThrow('aborted')

    expect(await glob(['.atmosphere-up-*', 'build.zip'], { cwd: resolve(directory, '..'), dot: true, onlyFiles: false })).toEqual([])
  })

  it('sets overlay wake keys and an 8 MiB allocation and returns to Hekate on reboot', async () => {
    vi.mocked(downloadAsset).mockResolvedValue(await readFile(join(cwd, 'test/fixtures/core.zip')))
    const onProgress = vi.fn()
    await buildPack({ bundle, resources: [resource], directory, onProgress })
    expect(await readFile(join(directory, 'config/ultrahand/config.ini'), 'utf8')).toBe('[ultrahand]\nkey_combo=L+DDOWN\n')
    expect(await readFile(join(directory, 'config/tesla/config.ini'), 'utf8')).toBe('[tesla]\nkey_combo=L+DDOWN\n')
    const heapSize = await readFile(join(directory, 'config/nx-ovlloader/heap_size.bin'))
    expect(heapSize.length).toBe(8)
    expect(heapSize.readBigUInt64LE()).toBe(0x800000n)
    expect(await readFile(join(directory, 'atmosphere/reboot_payload.bin'))).toEqual(await readFile(join(directory, 'payload.bin')))
    expect(await readFile(join(directory, 'bootloader/hekate_ipl.ini'))).toEqual(await readFile(join(cwd, 'assets/defaults/bootloader/hekate_ipl.ini')))
    const boot = parse(await readFile(join(directory, 'bootloader/hekate_ipl.ini'), 'utf8'))
    expect(boot['CFW emuMMC'].pkg3ex).toBe('1')
    expect(boot['CFW sysMMC'].pkg3ex).toBe('1')
    expect(boot['Stock sysMMC'].pkg3ex).toBeUndefined()
    expect(boot['CFW emuMMC'].userpmu).toBe('1')
    expect(boot['CFW sysMMC'].userpmu).toBe('1')
    expect(boot['Stock sysMMC'].userpmu).toBeUndefined()
    const settings = await readFile(join(directory, 'atmosphere/config/system_settings.ini'), 'utf8')
    expect(settings).toContain('dmnt_cheats_enabled_by_default = u8!0x0')
    expect(settings).toContain('dmnt_always_save_cheat_toggles = u8!0x0')
    expect(settings).toContain('usb30_force_enabled = u8!0x1')
    expect(settings).toContain('enable_dns_mitm = u8!0x1')
    const exosphere = await readFile(join(directory, 'exosphere.ini'), 'utf8')
    expect(exosphere).toContain('blank_prodinfo_sysmmc=1')
    expect(exosphere).toContain('blank_prodinfo_emummc=1')
    const hosts = await readFile(join(directory, 'atmosphere/hosts/emummc.txt'), 'utf8')
    expect(hosts).toContain('127.0.0.1 *nintendo.com')
    expect(await readFile(join(directory, 'atmosphere/hosts/sysmmc.txt'), 'utf8')).toBe(hosts)
    const messages = onProgress.mock.calls.map(([message]) => message)
    expect(messages).toContain('extracting ultrahand [1/1]')
    expect(messages).toContain('applying Atmosphere, Hekate, and overlay settings')
    expect(messages).toContain('setting Hekate reboot payload')
  })
})
