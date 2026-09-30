import { Buffer } from 'node:buffer'
import { readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'
import { glob } from 'tinyglobby'
import { afterEach, describe, expect, it } from 'vitest'
import { extractArchive } from '../../src/core'

const directory = fileURLToPath(new URL('../fixtures/.generated/archive', import.meta.url))

afterEach(() => rm(directory, { recursive: true, force: true }))

describe('extractArchive', () => {
  it('extracts selected applications, overlay files, and configuration without installing bundled extras', async () => {
    const archive = new AdmZip()
    for (const folder of ['switch/breeze/', 'config/breezehand/'])
      archive.addFile(folder, Buffer.alloc(0))

    for (const path of [
      'switch/breeze/Breeze.nro',
      'switch/.overlays/breezehand.ovl',
      'config/breezehand/lang/en.json',
      'switch/reboot_to_hekate.nro',
      'switch/.overlays/breezehand_watch.ovl',
      'atmosphere/contents/extra/exefs.nsp',
    ])
      archive.addFile(path, Buffer.from('component'))

    await extractArchive(archive.toBuffer(), directory, ['switch/breeze/', 'switch/.overlays/breezehand.ovl', 'config/breezehand/'])

    expect((await glob('**/*', { cwd: directory, dot: true })).sort()).toEqual([
      'config/breezehand/lang/en.json',
      'switch/.overlays/breezehand.ovl',
      'switch/breeze/Breeze.nro',
    ])
  })

  it('extracts overlay dot directories using the ZIP library', async () => {
    const data = await readFile(new URL('../fixtures/overlay.zip', import.meta.url))
    await extractArchive(data, directory)
    expect(await readFile(`${directory}/switch/.overlays/menu.ovl`, 'utf8')).toBe('overlay')
  })
})
