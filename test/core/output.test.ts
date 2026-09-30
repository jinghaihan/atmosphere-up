import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'
import { join, resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { afterEach, describe, expect, it } from 'vitest'
import { writeOutput } from '../../src/core'

const cwd = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const fixture = join(cwd, 'test/fixtures/.generated/output')
const directory = join(fixture, 'pack')

afterEach(() => rm(fixture, { recursive: true, force: true }))

describe('writeOutput', () => {
  it('preserves an existing pack on a download or extraction failure', async () => {
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'original'), 'keep')
    await expect(writeOutput(directory, true, async (staging) => {
      await writeFile(join(staging, 'partial'), 'incomplete')
      throw new Error('Download failed')
    })).rejects.toThrow('Download failed')
    expect(await readFile(join(directory, 'original'), 'utf8')).toBe('keep')
    expect(await glob('.atmosphere-up-*', { cwd: fixture, onlyDirectories: true, dot: true })).toEqual([])
  })

  it('replaces an existing pack only after the new pack is complete', async () => {
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'original'), 'old')
    await writeOutput(directory, true, async (staging) => {
      expect(await readFile(join(directory, 'original'), 'utf8')).toBe('old')
      await writeFile(join(staging, 'new'), 'complete')
    })
    expect(await glob('**/*', { cwd: directory })).toEqual(['new'])
  })

  it('writes a ZIP with SD card contents at the root, including hidden overlay folders', async () => {
    const destination = `${directory}.zip`
    await writeOutput(destination, false, async (staging) => {
      await mkdir(join(staging, 'switch/.overlays'), { recursive: true })
      await writeFile(join(staging, 'switch/.overlays/ovlmenu.ovl'), 'overlay')
      await writeFile(join(staging, 'payload.bin'), 'payload')
    }, true)
    const archive = new AdmZip(destination)
    expect(archive.readAsText('switch/.overlays/ovlmenu.ovl')).toBe('overlay')
    expect(archive.readAsText('payload.bin')).toBe('payload')
    expect(await glob('.atmosphere-up-*', { cwd: fixture, onlyDirectories: true, dot: true })).toEqual([])
  })

  it('removes partial files after cancellation without replacing the existing pack', async () => {
    const controller = new AbortController()
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'original'), 'keep')
    await expect(writeOutput(directory, true, async (staging) => {
      await writeFile(join(staging, 'partial'), 'incomplete')
      controller.abort()
    }, true, { signal: controller.signal })).rejects.toThrow('aborted')
    expect(await readFile(join(directory, 'original'), 'utf8')).toBe('keep')
    expect(await glob('.atmosphere-up-*', { cwd: fixture, onlyDirectories: true, dot: true })).toEqual([])
  })
})
