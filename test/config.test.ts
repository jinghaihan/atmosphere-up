import { fileURLToPath } from 'node:url'
import { resolve } from 'pathe'
import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config'

const cwd = resolve(fileURLToPath(new URL('..', import.meta.url)))

describe('resolveConfig', () => {
  it('uses the repository output configuration', async () => {
    expect(await resolveConfig({ cwd, output: undefined })).toMatchObject({ cwd, output: resolve(cwd, 'output') })
  })

  it('lets the CLI override the configuration', async () => {
    expect((await resolveConfig({ cwd, output: 'custom' })).output).toBe(resolve(cwd, 'custom'))
  })

  it('leaves output unset without a configuration', async () => {
    const directory = resolve(cwd, 'test/fixtures/empty')
    expect((await resolveConfig({ cwd: directory })).output).toBeUndefined()
  })

  it('rejects an empty output path', async () => {
    await expect(resolveConfig({ cwd, output: '' })).rejects.toThrow('non-empty')
  })

  it('retains configured ZIP output unless the CLI explicitly overrides it', async () => {
    const directory = resolve(cwd, 'test/fixtures/packed')
    expect((await resolveConfig({ cwd: directory, pack: undefined })).pack).toBe(true)
    expect((await resolveConfig({ cwd: directory, pack: false })).pack).toBe(false)
  })
})
