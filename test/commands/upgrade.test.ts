import process from 'node:process'
import * as p from '@clack/prompts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runUpgradeCommand } from '../../src/commands'
import { getBundles, inspectOutput } from '../../src/core'
import { buildUpgradePack, MODULE_GROUPS, resolveUpgradeResources } from '../../src/upgrade'

vi.mock('@clack/prompts', async original => ({
  ...await original<typeof import('@clack/prompts')>(),
  groupMultiselect: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  outro: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), message: vi.fn(), stop: vi.fn(), error: vi.fn() })),
}))
vi.mock('../../src/core', async original => ({
  ...await original<typeof import('../../src/core')>(),
  inspectOutput: vi.fn(),
}))
vi.mock('../../src/upgrade', async original => ({
  ...await original<typeof import('../../src/upgrade')>(),
  resolveUpgradeResources: vi.fn(),
  buildUpgradePack: vi.fn(),
}))

const config = { cwd: '/workspace', output: '/workspace/output' }
const bundle = getBundles().find(bundle => bundle.labels.hos === '22.5.0')!

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(p.groupMultiselect).mockReset().mockResolvedValue(['dbi'])
  vi.mocked(p.select).mockReset().mockResolvedValue(bundle)
  vi.mocked(p.confirm).mockReset().mockResolvedValue(false)
  vi.mocked(inspectOutput).mockReturnValue(false)
  vi.mocked(resolveUpgradeResources).mockReset().mockResolvedValue([])
  vi.mocked(buildUpgradePack).mockReset().mockResolvedValue()
  process.exitCode = 0
})

describe('runUpgradeCommand', () => {
  it('lists all modules with nothing preselected when no module arguments are supplied', async () => {
    await runUpgradeCommand(config)

    expect(p.groupMultiselect).toHaveBeenCalledWith(expect.objectContaining({
      options: MODULE_GROUPS,
      initialValues: [],
      required: false,
    }))
    expect(Object.keys(MODULE_GROUPS)).toEqual([
      'Core Modules',
      'Save Management',
      'File Management',
      'Cheats',
      'Performance Tuning',
      'Performance Monitoring',
      'Controller Support',
      'Streaming',
      'Amiibo',
      'Dependencies',
    ])
    expect(p.select).not.toHaveBeenCalled()
    expect(resolveUpgradeResources).toHaveBeenCalledWith(['dbi'], expect.objectContaining({ bundle: undefined }))
    expect(buildUpgradePack).toHaveBeenCalledWith(expect.objectContaining({
      modules: ['dbi'],
      directory: '/workspace/output/dbi',
    }))
  })

  it('preselects batch arguments but installs only the final interactive selection', async () => {
    vi.mocked(p.groupMultiselect).mockResolvedValue(['nx-shell'])

    await runUpgradeCommand({ ...config, modules: ['dbi', 'jksv'] })

    expect(p.groupMultiselect).toHaveBeenCalledWith(expect.objectContaining({ initialValues: ['dbi', 'jksv'] }))
    expect(resolveUpgradeResources).toHaveBeenCalledWith(['nx-shell'], expect.any(Object))
  })

  it('writes a combined ZIP for multiple modules', async () => {
    vi.mocked(p.groupMultiselect).mockResolvedValue(['dbi', 'jksv'])

    await runUpgradeCommand({ ...config, pack: true })

    expect(buildUpgradePack).toHaveBeenCalledWith(expect.objectContaining({
      modules: ['dbi', 'jksv'],
      directory: '/workspace/output/upgrade.zip',
      pack: true,
    }))
  })

  it.each(['atmosphere', 'sigpatches', 'mission-control'])('selects HOS for %s before resolving any releases', async (module) => {
    vi.mocked(p.groupMultiselect).mockResolvedValue([module])
    vi.mocked(p.select).mockImplementationOnce(async () => {
      expect(resolveUpgradeResources).not.toHaveBeenCalled()
      return bundle
    })

    await runUpgradeCommand(config)

    expect(resolveUpgradeResources).toHaveBeenCalledWith([module], expect.objectContaining({ bundle }))
  })

  it('uses an explicit supported HOS without a HOS prompt', async () => {
    vi.mocked(p.groupMultiselect).mockResolvedValue(['mission-control'])

    await runUpgradeCommand({ ...config, version: '22.5.0' })

    expect(p.select).not.toHaveBeenCalled()
    expect(resolveUpgradeResources).toHaveBeenCalledWith(['mission-control'], expect.objectContaining({ bundle }))
  })

  it('stops without downloads when the selection is empty or cancelled', async () => {
    const selections: (unknown[] | typeof p.CANCEL_SYMBOL)[] = [[], p.CANCEL_SYMBOL]
    for (const selection of selections) {
      vi.mocked(p.groupMultiselect).mockResolvedValueOnce(selection)
      await runUpgradeCommand(config)
    }

    expect(resolveUpgradeResources).not.toHaveBeenCalled()
    expect(buildUpgradePack).not.toHaveBeenCalled()
  })

  it('rejects unknown module arguments before showing the selection', async () => {
    await expect(runUpgradeCommand({ ...config, modules: ['unknown'] })).rejects.toThrow('unknown module: unknown')
    expect(p.groupMultiselect).not.toHaveBeenCalled()
    expect(resolveUpgradeResources).not.toHaveBeenCalled()
  })

  it('confirms replacement before resolving releases', async () => {
    vi.mocked(inspectOutput).mockReturnValue(true)

    await runUpgradeCommand(config)

    expect(p.confirm).toHaveBeenCalled()
    expect(resolveUpgradeResources).not.toHaveBeenCalled()
    expect(buildUpgradePack).not.toHaveBeenCalled()
  })

  it('waits for cleanup when an active upgrade is cancelled', async () => {
    let cleaned = false
    vi.mocked(buildUpgradePack).mockImplementationOnce(async (task) => {
      vi.mocked(p.spinner).mock.calls[0][0]!.onCancel!()
      await Promise.resolve()
      cleaned = true
      task.signal!.throwIfAborted()
    })

    await runUpgradeCommand(config)

    expect(cleaned).toBe(true)
    expect(p.cancel).toHaveBeenCalledWith('upgrade cancelled; temporary files removed')
    expect(p.outro).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(130)
    process.exitCode = 0
  })
})
