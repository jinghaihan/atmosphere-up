import type { Release } from '../../src/types'
import { Buffer } from 'node:buffer'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import AdmZip from 'adm-zip'
import { join } from 'pathe'
import { describe, expect, it, vi } from 'vitest'
import { installResources } from '../../src/core/install'
import { downloadAsset, getRelease } from '../../src/download'
import { resolveAmiibo } from '../../src/extensions'

vi.mock('../../src/download', () => ({ getRelease: vi.fn(), downloadAsset: vi.fn() }))

describe('resolveAmiibo', () => {
  it('installs the service and overlay at the SD root while preserving existing components', async () => {
    vi.mocked(getRelease).mockResolvedValueOnce({ tag_name: '1.1.3', assets: [{ name: 'emuiibo.zip' }, { name: 'emuiigen.jar' }] } as Release)
    const archive = new AdmZip()
    const service = 'atmosphere/contents/0100000000000352/exefs.nsp'
    const overlay = 'switch/.overlays/emuiibo.ovl'
    const language = 'emuiibo/overlay/lang/en.json'
    archive.addFile(`SdOut/${service}`, Buffer.from('service'))
    archive.addFile(`SdOut/${overlay}`, Buffer.from('overlay'))
    archive.addFile(`SdOut/${language}`, Buffer.from('{}'))
    vi.mocked(downloadAsset).mockResolvedValueOnce(archive.toBuffer())
    const directory = await mkdtemp(join(tmpdir(), 'atmosphere-up-amiibo-'))

    try {
      await writeFile(join(directory, 'payload.bin'), 'hekate')
      const resource = await resolveAmiibo('emuiibo')
      expect(getRelease).toHaveBeenCalledWith('XorTroll/emuiibo', undefined, undefined)
      expect(resource).toMatchObject({ module: 'emuiibo', asset: { name: 'emuiibo.zip' } })

      await installResources([resource], directory)

      expect(await readFile(join(directory, service), 'utf8')).toBe('service')
      expect(await readFile(join(directory, overlay), 'utf8')).toBe('overlay')
      expect(await readFile(join(directory, language), 'utf8')).toBe('{}')
      expect(await readFile(join(directory, 'payload.bin'), 'utf8')).toBe('hekate')
      await expect(readFile(join(directory, `SdOut/${overlay}`))).rejects.toThrow()
    }
    finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
