import { homedir } from 'node:os'
import { join as nativeJoin, normalize as nativeNormalize } from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import * as p from '@clack/prompts'
import { join } from 'pathe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runBuildCommand } from '../../src/commands'
import { resolveConfig } from '../../src/config'
import { buildPack, getBundles, inspectOutput, resolveResources } from '../../src/core'

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  outro: vi.fn(),
  isCancel: (value: unknown) => typeof value === 'symbol',
  spinner: vi.fn(() => ({ start: vi.fn(), message: vi.fn(), stop: vi.fn(), error: vi.fn() })),
}))
vi.mock('../../src/config', () => ({ resolveConfig: vi.fn() }))
vi.mock('../../src/core', async original => ({
  ...await original<typeof import('../../src/core')>(),
  inspectOutput: vi.fn(),
  resolveResources: vi.fn(),
  buildPack: vi.fn(),
}))

const bundle = getBundles().find(bundle => bundle.labels.hos === '21.2.0')!

beforeEach(() => {
  vi.clearAllMocks()
  process.exitCode = 0
  vi.mocked(resolveConfig).mockResolvedValue({ cwd: '/workspace', output: '/workspace/output', pack: false })
  vi.mocked(p.select).mockResolvedValue(bundle)
  vi.mocked(inspectOutput).mockReturnValue(false)
  vi.mocked(resolveResources).mockResolvedValue([])
  vi.mocked(buildPack).mockResolvedValue()
})

describe('runBuildCommand', () => {
  it('stops before querying GitHub when replacing the output is declined', async () => {
    vi.mocked(inspectOutput).mockReturnValue(true)
    vi.mocked(p.confirm).mockResolvedValue(false)
    await runBuildCommand({})
    expect(resolveResources).not.toHaveBeenCalled()
    expect(buildPack).not.toHaveBeenCalled()
    const options = vi.mocked(p.confirm).mock.calls[0][0]
    expect({ ...options, message: stripVTControlCharacters(options.message) }).toEqual({
      message: `output already exists: ${nativeNormalize('/workspace/output/atmosphere-1.10.2-hos-21.2.0')}. replace it?`,
      initialValue: false,
    })
  })

  it('builds a named ZIP inside the configured parent and forwards progress', async () => {
    vi.mocked(resolveConfig).mockResolvedValue({ cwd: '/workspace', output: '/workspace/output', pack: true })
    await runBuildCommand({})
    expect(buildPack).toHaveBeenCalledWith(bundle, [], '/workspace/output/atmosphere-1.10.2-hos-21.2.0.zip', false, true, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    const task = vi.mocked(resolveResources).mock.calls[0][1]!
    task.onProgress!('extracting atmosphere')
    expect(stripVTControlCharacters(vi.mocked(p.spinner).mock.results[0].value.message.mock.lastCall[0])).toBe('extracting atmosphere')
  })

  it('shortens the final display path without changing the build destination', async () => {
    const output = join(homedir(), 'packs')
    const displayPath = nativeJoin('~', 'packs', 'atmosphere-1.10.2-hos-21.2.0')
    vi.mocked(resolveConfig).mockResolvedValue({ cwd: '/workspace', output, pack: false })
    vi.mocked(inspectOutput).mockReturnValue(true)
    vi.mocked(p.confirm).mockResolvedValue(true)
    await runBuildCommand({})
    expect(vi.mocked(buildPack).mock.calls[0][2]).toBe(join(output, 'atmosphere-1.10.2-hos-21.2.0'))
    expect(stripVTControlCharacters(vi.mocked(p.confirm).mock.calls[0][0].message)).toBe(`output already exists: ${displayPath}. replace it?`)
    expect(stripVTControlCharacters(vi.mocked(p.outro).mock.calls[0][0]!)).toBe(`pack ready: ${displayPath}`)
  })

  it('waits for cancellation cleanup before reporting the abort', async () => {
    let cleaned = false
    vi.mocked(buildPack).mockImplementationOnce(async (_bundle, _resources, _directory, _replace, _pack, task) => {
      vi.mocked(p.spinner).mock.calls[0][0]!.onCancel!()
      await Promise.resolve()
      cleaned = true
      task!.signal!.throwIfAborted()
    })
    await runBuildCommand({})
    expect(cleaned).toBe(true)
    expect(p.cancel).toHaveBeenCalledWith('build cancelled; temporary files removed')
    expect(p.outro).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(130)
    process.exitCode = 0
  })
})
