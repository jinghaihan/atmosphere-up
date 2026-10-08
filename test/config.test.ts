import { mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config'

const cwd = resolve(fileURLToPath(new URL('..', import.meta.url)))

describe('resolveConfig', () => {
  it('defaults to build mode and accepts upgrade mode', async () => {
    const directory = resolve(cwd, 'test/fixtures/empty')
    expect((await resolveConfig({ cwd: directory })).mode).toBe('build')
    expect((await resolveConfig({ cwd: directory, mode: 'upgrade' })).mode).toBe('upgrade')
  })

  it('rejects an unknown mode', async () => {
    await expect(resolveConfig({ cwd, mode: 'unknown' as 'build' })).rejects.toThrow('invalid mode: unknown')
  })

  it('enables firmware prompts by default and allows the CLI to disable them', async () => {
    const directory = resolve(cwd, 'test/fixtures/empty')
    expect((await resolveConfig({ cwd: directory, firmware: undefined })).firmware).toBe(true)
    expect((await resolveConfig({ cwd: directory, firmware: false })).firmware).toBe(false)
  })

  it('uses the repository output configuration', async () => {
    expect(await resolveConfig({ cwd, output: undefined })).toMatchObject({ cwd, output: resolve(cwd, 'output') })
  })

  it('lets the CLI override the configuration', async () => {
    expect((await resolveConfig({ cwd, output: 'custom' })).output).toBe(resolve(cwd, 'custom'))
  })

  it('leaves output unset without a configuration', async () => {
    const directory = resolve(cwd, 'test/fixtures/empty')
    expect((await resolveConfig({ cwd: directory })).output).toBeUndefined()
    expect((await resolveConfig({ cwd: directory })).extra).toBeUndefined()
  })

  it('enables extensions by default and allows the CLI to disable them', async () => {
    const directory = resolve(cwd, 'test/fixtures/empty')
    expect((await resolveConfig({ cwd: directory, ext: undefined })).ext).toBe(true)
    expect((await resolveConfig({ cwd: directory, ext: false })).ext).toBe(false)
  })

  it('retains disabled extensions from configuration unless the CLI enables them', async () => {
    const directory = resolve(cwd, 'test/fixtures/core-only')
    expect((await resolveConfig({ cwd: directory, ext: undefined })).ext).toBe(false)
    expect((await resolveConfig({ cwd: directory, ext: true })).ext).toBe(true)
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

describe('extra configuration', () => {
  const directory = join(cwd, 'test/fixtures/.generated/config')
  const config = join(directory, 'atmosphere-up.config.json')

  beforeEach(async () => {
    await mkdir(join(directory, 'personal'), { recursive: true })
    await writeFile(config, JSON.stringify({ extra: './personal' }))
  })

  afterEach(() => rm(directory, { recursive: true, force: true }))

  it('resolves extra from the configured working directory', async () => {
    expect((await resolveConfig({ cwd: directory })).extra).toBe(join(directory, 'personal'))
  })

  it('retains configured extensions when built-in optional modules are disabled', async () => {
    const extensions = [{ name: 'mhgu-overlay', repository: 'jinghaihan/mhgu-overlay', assets: [{ name: 'mhgu-overlay.ovl', target: 'switch/.overlays/mhgu-overlay.ovl' }] }]
    await writeFile(config, JSON.stringify({ extensions }))

    expect(await resolveConfig({ cwd: directory, ext: false })).toMatchObject({ ext: false, extensions })
  })

  it.each(['dbi', 'mhgu-overlay'])('rejects conflicting module names before downloads: %s', async (name) => {
    await writeFile(config, JSON.stringify({ extensions: [
      { name: 'mhgu-overlay', repository: 'jinghaihan/mhgu-overlay', assets: [{ name: 'mhgu-overlay.ovl' }] },
      { name, repository: '3096/feth-overlays', assets: [{ name: 'feth-overlays.zip' }] },
    ] }))

    await expect(resolveConfig({ cwd: directory })).rejects.toThrow(`duplicate module name: ${name}`)
  })

  it('rejects a missing source before a build can start', async () => {
    await rm(join(directory, 'personal'), { recursive: true })

    await expect(resolveConfig({ cwd: directory })).rejects.toThrow('extra must be an existing directory')
  })

  it('rejects a file used as the source directory', async () => {
    await writeFile(config, JSON.stringify({ extra: './file' }))
    await writeFile(join(directory, 'file'), 'not a directory')

    await expect(resolveConfig({ cwd: directory })).rejects.toThrow('extra must be an existing directory')
  })

  it('rejects an empty extra path', async () => {
    await writeFile(config, JSON.stringify({ extra: '' }))

    await expect(resolveConfig({ cwd: directory })).rejects.toThrow('extra must be a non-empty directory path')
  })
})
