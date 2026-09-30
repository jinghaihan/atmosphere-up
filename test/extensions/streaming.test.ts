import type { StreamingTool } from '../../src/extensions'
import type { Release } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRelease } from '../../src/download'
import { resolveStreaming } from '../../src/extensions'

vi.mock('../../src/download', () => ({ getRelease: vi.fn() }))

beforeEach(() => {
  vi.mocked(getRelease).mockReset()
  vi.mocked(getRelease).mockImplementation(async repository => ({
    tag_name: 'v1',
    assets: repository === 'XITRIX/Moonlight-Switch'
      ? [{ name: 'Moonlight-Switch.nro' }, { name: 'Debug.elf' }, { name: 'moonlight-app-release.apk' }]
      : [{ name: 'SysDVR.zip' }, { name: 'SysDVR-USB-Only.zip' }, { name: 'SysDVR-Client-dotnet.zip' }],
  } as Release))
})

describe('resolveStreaming', () => {
  it.each<StreamingTool[]>([
    ['moonlight-switch'],
    ['sys-dvr'],
    ['moonlight-switch', 'sys-dvr'],
  ])('installs only the selected streaming tools: %j', async (...modules) => {
    const resources = await resolveStreaming(modules)

    expect(resources.map(resource => resource.module)).toEqual(modules)
    for (const resource of resources) {
      if (resource.module === 'moonlight-switch') {
        expect(resource).toMatchObject({ asset: { name: 'Moonlight-Switch.nro' }, target: 'switch/Moonlight-Switch/Moonlight-Switch.nro' })
        expect(getRelease).toHaveBeenCalledWith('XITRIX/Moonlight-Switch', undefined, undefined)
      }
      else {
        expect(resource).toMatchObject({ asset: { name: 'SysDVR.zip' } })
        expect(resource.target).toBeUndefined()
        expect(resource.paths).toBeUndefined()
        expect(getRelease).toHaveBeenCalledWith('exelix11/SysDVR', undefined, undefined)
      }
    }
  })

  it('does not query GitHub when streaming is declined', async () => {
    expect(await resolveStreaming([])).toEqual([])
    expect(getRelease).not.toHaveBeenCalled()
  })
})
