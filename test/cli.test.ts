import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runBuildCommand } from '../src/commands'

vi.mock('../src/commands', () => ({ runBuildCommand: vi.fn().mockResolvedValue(undefined) }))
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

    expect(runBuildCommand).toHaveBeenCalledTimes(1)
    expect(vi.mocked(runBuildCommand).mock.calls[0][0].ext).toBe(ext)
  })
})
