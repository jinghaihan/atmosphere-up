import type { Release } from '../../src/types'
import { Buffer } from 'node:buffer'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import * as p from '@clack/prompts'
import AdmZip from 'adm-zip'
import { parse } from 'ini'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadAsset, getRelease } from '../../src/download'
import { promptCheatSettings, resolveCheats } from '../../src/extensions'
import { buildUpgradePack } from '../../src/upgrade'

vi.mock('../../src/download', () => ({ getRelease: vi.fn(), downloadAsset: vi.fn() }))
vi.mock('@clack/prompts', async original => ({
  ...await original<typeof import('@clack/prompts')>(),
  confirm: vi.fn(),
}))

let directory: string | undefined

beforeEach(() => {
  vi.mocked(getRelease).mockReset()
  vi.mocked(p.confirm).mockReset()
  vi.mocked(downloadAsset).mockReset().mockResolvedValue(Buffer.from('overlay'))
})

afterEach(async () => {
  if (directory)
    await rm(directory, { recursive: true, force: true })

  directory = undefined
})

describe('promptCheatSettings', () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('collects independent settings with enabled=%s and remembered=%s', async (enabledByDefault, rememberToggles) => {
    const controller = new AbortController()
    vi.mocked(p.confirm).mockResolvedValueOnce(enabledByDefault).mockResolvedValueOnce(rememberToggles)

    expect(await promptCheatSettings(controller)).toEqual({ enabledByDefault, rememberToggles })
    expect(vi.mocked(p.confirm).mock.calls.map(([options]) => ({
      message: options.message,
      initialValue: options.initialValue,
      signal: options.signal,
    }))).toEqual([
      { message: 'enable cheats by default?', initialValue: false, signal: controller.signal },
      { message: 'remember cheat toggles?', initialValue: false, signal: controller.signal },
    ])
  })

  it.each([1, 2])('aborts when confirmation %s is cancelled', async (question) => {
    const controller = new AbortController()
    if (question === 2)
      vi.mocked(p.confirm).mockResolvedValueOnce(false)

    vi.mocked(p.confirm).mockResolvedValueOnce(p.CANCEL_SYMBOL)

    await expect(promptCheatSettings(controller)).rejects.toThrow('aborted')

    expect(controller.signal.aborted).toBe(true)
    expect(p.confirm).toHaveBeenCalledTimes(question)
  })
})

describe('resolveCheats', () => {
  it('resolves only the selected overlays without requiring the NRO tools', async () => {
    vi.mocked(getRelease)
      .mockResolvedValueOnce({ tag_name: 'v1', assets: [{ name: 'ovlEdiZon.ovl' }, { name: 'EdiZon-Overlay.zip' }] } as Release)
      .mockResolvedValueOnce({ tag_name: 'v2', assets: [{ name: 'breezehand.zip' }] } as Release)

    const resources = await resolveCheats(['edizon-overlay', 'breezehand'])

    expect(vi.mocked(getRelease).mock.calls.map(([repository]) => repository)).toEqual(['proferabg/EdiZon-Overlay', 'tomvita/Breezehand-Overlay'])
    expect(resources).toMatchObject([
      { module: 'edizon-overlay', asset: { name: 'ovlEdiZon.ovl' }, target: 'switch/.overlays/ovlEdiZon.ovl' },
      { module: 'breezehand', paths: ['switch/.overlays/breezehand.ovl', 'config/breezehand/'] },
    ])
  })

  it.each([
    ['edizon-se', 'tomvita/EdiZon-SE', 'edizon.zip', 'EdiZon_alt.zip', 'switch/edizon/'],
    ['breeze', 'tomvita/Breeze-Beta', 'Breeze.zip', 'version.txt', 'switch/breeze/'],
  ] as const)('selects the regular %s archive and only its application directory', async (module, repository, name, otherAsset, path) => {
    vi.mocked(getRelease)
      .mockResolvedValueOnce({ tag_name: 'v2', assets: [{ name }, { name: otherAsset }] } as Release)

    const resources = await resolveCheats([module])

    expect(getRelease).toHaveBeenLastCalledWith(repository, undefined, undefined)
    expect(resources).toMatchObject([
      { module, asset: { name }, paths: [path] },
    ])
  })

  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('applies enabled=%s and remembered=%s while preserving other settings', async (enabledByDefault, rememberToggles) => {
    directory = await mkdtemp(join(tmpdir(), 'atmosphere-up-cheats-'))
    const path = join(directory, 'atmosphere/config/system_settings.ini')
    await mkdir(join(directory, 'atmosphere/config'), { recursive: true })
    await writeFile(path, '[atmosphere]\ndmnt_cheats_enabled_by_default = u8!0x1\ndmnt_always_save_cheat_toggles = u8!0x1\nenable_dns_mitm = u8!0x0\n\n[usb]\nusb30_force_enabled = u8!0x1\n')
    vi.mocked(getRelease).mockResolvedValueOnce({ tag_name: 'v1', assets: [{ name: 'ovlEdiZon.ovl' }] } as Release)

    const [resource] = await resolveCheats(['edizon-overlay'], { cheats: { enabledByDefault, rememberToggles } })
    await resource.configure!(directory)

    expect(parse(await readFile(path, 'utf8'))).toMatchObject({
      atmosphere: {
        dmnt_cheats_enabled_by_default: enabledByDefault ? 'u8!0x1' : 'u8!0x0',
        dmnt_always_save_cheat_toggles: rememberToggles ? 'u8!0x1' : 'u8!0x0',
        enable_dns_mitm: 'u8!0x0',
      },
      usb: { usb30_force_enabled: 'u8!0x1' },
    })
  })

  it('includes cheat settings in an overlay-only upgrade ZIP without an Atmosphere download', async () => {
    directory = await mkdtemp(join(tmpdir(), 'atmosphere-up-cheats-'))
    vi.mocked(getRelease).mockResolvedValueOnce({ tag_name: 'v1', assets: [{ name: 'ovlEdiZon.ovl' }] } as Release)
    const resources = await resolveCheats(['edizon-overlay'], { cheats: { enabledByDefault: true, rememberToggles: false } })
    const destination = join(directory, 'edizon-overlay.zip')

    await buildUpgradePack({ modules: ['edizon-overlay'], resources, directory: destination, pack: true })

    const archive = new AdmZip(destination)
    expect(archive.readAsText('switch/.overlays/ovlEdiZon.ovl')).toBe('overlay')
    expect(parse(archive.readAsText('atmosphere/config/system_settings.ini'))).toMatchObject({
      atmosphere: { dmnt_cheats_enabled_by_default: 'u8!0x1', dmnt_always_save_cheat_toggles: 'u8!0x0' },
      usb: { usb30_force_enabled: 'u8!0x1' },
      ro: { ease_nro_restriction: 'u8!0x1' },
    })
    expect(downloadAsset).toHaveBeenCalledTimes(1)
    expect(archive.getEntry('atmosphere/package3')).toBeNull()
  })
})
