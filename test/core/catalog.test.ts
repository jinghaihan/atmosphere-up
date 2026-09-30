import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { getBundlePath, getBundles } from '../../src/core'
import { getOutputName, sha256 } from '../../src/utils'

describe('getBundles', () => {
  it('sorts all supported HOS versions numerically, newest first', () => {
    expect(getBundles().map(bundle => bundle.labels.hos)).toEqual([
      '22.5.0',
      '22.1.0',
      '22.0.0',
      '21.2.0',
      '19.0.0',
      '18.1.0',
      '18.0.0',
      '17.0.0',
      '16.1.0',
    ])
  })

  it('resolves every bundled archive with the recorded digest', async () => {
    for (const bundle of getBundles())
      expect(sha256(await readFile(getBundlePath(bundle)))).toBe(bundle.sha256)
  })
})

describe('getOutputName', () => {
  it('uses numeric Atmosphere and HOS versions', () => {
    const bundle = getBundles().find(bundle => bundle.labels.hos === '21.2.0')!
    expect(getOutputName(bundle)).toBe('atmosphere-1.10.2-hos-21.2.0')
  })
})
