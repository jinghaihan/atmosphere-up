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
import { resolveSaveManagement } from '../../src/extensions'

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
vi.mock('../../src/extensions', () => ({ resolveSaveManagement: vi.fn() }))
vi.mock('../../src/core', async original => ({
  ...await original<typeof import('../../src/core')>(),
  inspectOutput: vi.fn(),
  resolveResources: vi.fn(),
  buildPack: vi.fn(),
}))

const bundle = getBundles().find(bundle => bundle.labels.hos === '21.2.0')!

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(p.select).mockReset()
  vi.mocked(p.confirm).mockReset()
  vi.mocked(buildPack).mockReset()
  process.exitCode = 0
  vi.mocked(resolveConfig).mockResolvedValue({ cwd: '/workspace', output: '/workspace/output', pack: false })
  vi.mocked(p.select).mockResolvedValue(bundle)
  vi.mocked(inspectOutput).mockReturnValue(false)
  vi.mocked(resolveResources).mockResolvedValue([])
  vi.mocked(resolveSaveManagement).mockResolvedValue({ module: 'jksv' } as Awaited<ReturnType<typeof resolveSaveManagement>>)
  vi.mocked(buildPack).mockResolvedValue()
})

describe('runBuildCommand', () => {
  it('skips optional downloads when save management is declined', async () => {
    vi.mocked(p.confirm).mockResolvedValue(false)
    vi.mocked(buildPack).mockImplementationOnce(async (_bundle, _resources, _directory, _replace, _pack, task) => {
      expect(p.confirm).not.toHaveBeenCalled()
      expect(await task!.onCoreReady!()).toEqual([])
    })

    await runBuildCommand({})

    expect(resolveSaveManagement).not.toHaveBeenCalled()
    expect(p.select).toHaveBeenCalledTimes(1)
    expect(p.outro).toHaveBeenCalled()
  })

  it.each(['jksv', 'checkpoint'] as const)('selects %s after the core pack is assembled, with JKSV as the default', async (module) => {
    vi.mocked(p.confirm).mockResolvedValue(true)
    vi.mocked(p.select).mockResolvedValueOnce(bundle).mockResolvedValueOnce(module)
    vi.mocked(buildPack).mockImplementationOnce(async (_bundle, _resources, _directory, _replace, _pack, task) => {
      expect(p.confirm).not.toHaveBeenCalled()
      await task!.onCoreReady!()
    })

    await runBuildCommand({})

    expect(resolveSaveManagement).toHaveBeenCalledWith(module, expect.any(Object))
    expect(vi.mocked(p.select).mock.calls[1][0]).toMatchObject({
      initialValue: 'jksv',
      options: [
        { value: 'jksv', hint: 'https://github.com/J-D-K/JKSV' },
        { value: 'checkpoint', hint: 'https://github.com/BernardoGiordano/Checkpoint' },
      ],
    })
  })

  it.each(['confirm', 'select'] as const)('cancels from the extension %s prompt before resolving optional releases', async (prompt) => {
    vi.mocked(p.confirm).mockResolvedValue(prompt === 'confirm' ? Symbol('cancel') : true)
    vi.mocked(p.select).mockResolvedValueOnce(bundle).mockResolvedValueOnce(Symbol('cancel'))
    vi.mocked(buildPack).mockImplementationOnce(async (_bundle, _resources, _directory, _replace, _pack, task) => {
      await task!.onCoreReady!()
    })

    await runBuildCommand({})

    expect(resolveSaveManagement).not.toHaveBeenCalled()
    expect(p.outro).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(130)
    process.exitCode = 0
  })

  it('uses the requested HOS version without prompting', async () => {
    vi.mocked(resolveConfig).mockResolvedValue({ cwd: '/workspace', output: '/workspace/output', pack: false, version: '21.2.0' })
    await runBuildCommand({ version: '21.2.0' })
    expect(p.select).not.toHaveBeenCalled()
    expect(resolveResources).toHaveBeenCalledWith(bundle, expect.any(Object))
    expect(vi.mocked(buildPack).mock.calls[0][0]).toBe(bundle)
  })

  it('rejects an unsupported HOS version before checking output or querying GitHub', async () => {
    vi.mocked(resolveConfig).mockResolvedValue({ version: '99.0.0' })
    await expect(runBuildCommand({ version: '99.0.0' })).rejects.toThrow('unsupported HOS version: 99.0.0')
    expect(p.select).not.toHaveBeenCalled()
    expect(inspectOutput).not.toHaveBeenCalled()
    expect(resolveResources).not.toHaveBeenCalled()
    expect(buildPack).not.toHaveBeenCalled()
  })

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
