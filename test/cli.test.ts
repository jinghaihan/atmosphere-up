import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runCommand } from '../src/commands'

vi.mock('../src/commands', () => ({ runCommand: vi.fn().mockResolvedValue(undefined) }))
vi.mock('undici', () => ({ EnvHttpProxyAgent: vi.fn(), setGlobalDispatcher: vi.fn() }))

const argv = [...process.argv]

afterEach(() => {
  process.argv.splice(0, process.argv.length, ...argv)
  vi.clearAllMocks()
})

describe('cli extension options', () => {
  it.each([
    [[], undefined],
    [['--ext'], true],
    [['--no-ext'], false],
  ])('parses %j as ext=%s', async (flags, ext) => {
    vi.resetModules()
    process.argv.splice(0, process.argv.length, 'node', 'atmosphere-up', ...flags)

    await import('../src/cli')

    expect(runCommand).toHaveBeenCalledTimes(1)
    expect(vi.mocked(runCommand).mock.calls[0][0].ext).toBe(ext)
  })
})

describe('cli firmware options', () => {
  it.each([
    [[], undefined],
    [['--firmware'], true],
    [['--no-firmware'], false],
  ])('parses %j as firmware=%s', async (flags, firmware) => {
    vi.resetModules()
    process.argv.splice(0, process.argv.length, 'node', 'atmosphere-up', ...flags)

    await import('../src/cli')

    expect(vi.mocked(runCommand).mock.calls[0][0].firmware).toBe(firmware)
  })
})

describe('cli modes', () => {
  it.each([
    [[], undefined, undefined],
    [['build'], 'build', undefined],
    [['upgrade'], 'upgrade', undefined],
    [['upgrade', 'dbi'], 'upgrade', ['dbi']],
    [['upgrade', 'dbi', 'jksv', 'nx-shell'], 'upgrade', ['dbi', 'jksv', 'nx-shell']],
  ])('passes mode and module arguments from %j', async (args, mode, modules) => {
    vi.resetModules()
    process.argv.splice(0, process.argv.length, 'node', 'atmosphere-up', ...args)

    await import('../src/cli')

    expect(runCommand).toHaveBeenCalledWith(expect.objectContaining({ mode, modules }))
  })

  it('lets CAC separate options from the batch of modules', async () => {
    vi.resetModules()
    process.argv.splice(0, process.argv.length, 'node', 'atmosphere-up', 'upgrade', 'dbi', '--output', './custom', 'jksv', '--pack')

    await import('../src/cli')

    expect(runCommand).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'upgrade',
      modules: ['dbi', 'jksv'],
      output: './custom',
      pack: true,
    }))
  })
})
