import type { Resource } from '../../src/core'
import { readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'pathe'
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
})

describe('buildPack', () => {
  it('sets overlay wake keys and an 8 MiB allocation and returns to Hekate on reboot', async () => {
    vi.mocked(downloadAsset).mockResolvedValue(await readFile(join(cwd, 'test/fixtures/core.zip')))
    const onProgress = vi.fn()
    await buildPack(bundle, [resource], directory, false, false, { onProgress })
    expect(await readFile(join(directory, 'config/ultrahand/config.ini'), 'utf8')).toBe('[ultrahand]\nkey_combo=L+DDOWN\n')
    expect(await readFile(join(directory, 'config/tesla/config.ini'), 'utf8')).toBe('[tesla]\nkey_combo=L+DDOWN\n')
    const heapSize = await readFile(join(directory, 'config/nx-ovlloader/heap_size.bin'))
    expect(heapSize.length).toBe(8)
    expect(heapSize.readBigUInt64LE()).toBe(0x800000n)
    expect(await readFile(join(directory, 'atmosphere/reboot_payload.bin'))).toEqual(await readFile(join(directory, 'payload.bin')))
    expect(await readFile(join(directory, 'bootloader/hekate_ipl.ini'))).toEqual(await readFile(join(cwd, 'src/defaults/bootloader/hekate_ipl.ini')))
    const settings = await readFile(join(directory, 'atmosphere/config/system_settings.ini'), 'utf8')
    expect(settings).toContain('dmnt_cheats_enabled_by_default = u8!0x0')
    expect(settings).toContain('dmnt_always_save_cheat_toggles = u8!0x0')
    expect(settings).toContain('usb30_force_enabled = u8!0x1')
    expect(settings).toContain('enable_dns_mitm = u8!0x1')
    const exosphere = await readFile(join(directory, 'exosphere.ini'), 'utf8')
    expect(exosphere).toContain('blank_prodinfo_sysmmc=0')
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
