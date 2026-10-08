import type { Resource } from '../../src/core'
import { Buffer } from 'node:buffer'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'
import { parse } from 'ini'
import { join, resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildPack, getBundles } from '../../src/core'
import { downloadAsset, getRelease } from '../../src/download'

vi.mock('../../src/download', () => ({ downloadAsset: vi.fn(), getRelease: vi.fn() }))

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
  it.each([false, true])('installs configured files and ZIPs without optional prompts, before firmware and extra files, with pack=%s', async (pack) => {
    const extra = join(directory, 'personal')
    await mkdir(join(extra, 'switch/.overlays'), { recursive: true })
    await writeFile(join(extra, 'switch/.overlays/mhgu-overlay.ovl'), 'personal overlay')

    const archive = new AdmZip()
    archive.addFile('switch/.overlays/feth-class-edit.ovl', Buffer.from('class editor'))
    archive.addFile('switch/.overlays/feth-support-viewer.ovl', Buffer.from('support viewer'))
    const core = await readFile(join(cwd, 'test/fixtures/core.zip'))

    vi.mocked(getRelease).mockResolvedValueOnce({
      tag_name: 'v0.6.0',
      html_url: 'https://github.com/jinghaihan/mhgu-overlay/releases/v0.6.0',
      assets: [{ name: 'mhgu-overlay.ovl' }],
    } as Awaited<ReturnType<typeof getRelease>>).mockResolvedValueOnce({
      tag_name: '0.1.0',
      html_url: 'https://github.com/3096/feth-overlays/releases/0.1.0',
      assets: [{ name: 'feth-overlays.zip' }],
    } as Awaited<ReturnType<typeof getRelease>>)
    vi.mocked(downloadAsset).mockResolvedValueOnce(core).mockResolvedValueOnce(Buffer.from('downloaded overlay')).mockResolvedValueOnce(archive.toBuffer())
    const destination = join(directory, `result${pack ? '.zip' : ''}`)

    await buildPack({
      bundle,
      resources: [resource],
      directory: destination,
      pack,
      extra,
      extensions: [
        { name: 'mhgu-overlay', repository: 'jinghaihan/mhgu-overlay', assets: [{ name: 'mhgu-overlay.ovl', target: 'switch/.overlays/mhgu-overlay.ovl' }] },
        { name: 'feth-overlays', repository: '3096/feth-overlays', assets: [{ name: 'feth-overlays.zip' }] },
      ],
      onExtensionsReady: async () => {
        const [path] = await glob('.atmosphere-up-*/pack/switch/.overlays/mhgu-overlay.ovl', { cwd: directory, dot: true, absolute: true })
        expect(await readFile(path, 'utf8')).toBe('downloaded overlay')
        expect(downloadAsset).toHaveBeenCalledTimes(3)
        return []
      },
    })

    const read = async (path: string) => pack ? new AdmZip(destination).readAsText(path) : readFile(join(destination, path), 'utf8')
    expect(await read('switch/.overlays/mhgu-overlay.ovl')).toBe('personal overlay')
    expect(await read('switch/.overlays/feth-class-edit.ovl')).toBe('class editor')
    expect(await read('switch/.overlays/feth-support-viewer.ovl')).toBe('support viewer')
    expect(JSON.parse(await read('pack-manifest.json')).resources.map((item: Resource) => item.module)).toEqual(['ultrahand', 'mhgu-overlay', 'feth-overlays'])
  })

  it.each([false, true])('overrides downloaded files and defaults with extra files and pack=%s', async (pack) => {
    const extra = join(directory, 'personal')
    await mkdir(join(extra, 'config/JKSV'), { recursive: true })
    await writeFile(join(extra, 'hbmenu.nro'), 'personal hbmenu')
    await writeFile(join(extra, 'config/JKSV/JKSV.json'), '{"ExportToZip":1}')
    vi.mocked(downloadAsset).mockResolvedValueOnce(await readFile(join(cwd, 'test/fixtures/core.zip')))
    const destination = join(directory, `result${pack ? '.zip' : ''}`)

    await buildPack({ bundle, resources: [resource], directory: destination, extra, pack })

    if (pack) {
      const archive = new AdmZip(destination)
      expect(archive.readAsText('hbmenu.nro')).toBe('personal hbmenu')
      expect(JSON.parse(archive.readAsText('config/JKSV/JKSV.json'))).toEqual({ ExportToZip: 1 })
      expect(archive.getEntry('pack-manifest.json')).not.toBeNull()
    }
    else {
      expect(await readFile(join(destination, 'hbmenu.nro'), 'utf8')).toBe('personal hbmenu')
      expect(JSON.parse(await readFile(join(destination, 'config/JKSV/JKSV.json'), 'utf8'))).toEqual({ ExportToZip: 1 })
    }
  })

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
    expect(JSON.parse(archive.readAsText('config/JKSV/JKSV.json'))).toEqual({
      ExportToZip: 0,
      HoldForDeletion: 0,
      HoldForRestoration: 0,
      HoldForOverWrite: 0,
    })
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
