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
  it('sets matching Ultrahand and Tesla wake keys and returns to Hekate on reboot', async () => {
    vi.mocked(downloadAsset).mockResolvedValue(await readFile(join(cwd, 'test/fixtures/core.zip')))
    const onProgress = vi.fn()
    await buildPack(bundle, [resource], directory, false, false, { onProgress })
    expect(await readFile(join(directory, 'config/ultrahand/config.ini'), 'utf8')).toBe('[ultrahand]\nkey_combo=L+DDOWN\n')
    expect(await readFile(join(directory, 'config/tesla/config.ini'), 'utf8')).toBe('[tesla]\nkey_combo=L+DDOWN\n')
    expect(await readFile(join(directory, 'atmosphere/reboot_payload.bin'))).toEqual(await readFile(join(directory, 'payload.bin')))
    expect(await readFile(join(directory, 'bootloader/hekate_ipl.ini'))).toEqual(await readFile(join(cwd, 'src/hekate_ipl.ini')))
    const messages = onProgress.mock.calls.map(([message]) => message)
    expect(messages).toContain('extracting ultrahand [1/1]')
    expect(messages).toContain('writing Hekate boot entries and Ultrahand wake keys')
  })
})
