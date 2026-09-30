import { readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { extractArchive } from '../../src/core'

const directory = fileURLToPath(new URL('../fixtures/.generated/archive', import.meta.url))

afterEach(() => rm(directory, { recursive: true, force: true }))

describe('extractArchive', () => {
  it('extracts overlay dot directories using the ZIP library', async () => {
    const data = await readFile(new URL('../fixtures/overlay.zip', import.meta.url))
    await extractArchive(data, directory)
    expect(await readFile(`${directory}/switch/.overlays/menu.ovl`, 'utf8')).toBe('overlay')
  })
})
