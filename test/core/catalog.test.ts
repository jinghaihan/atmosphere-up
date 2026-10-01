import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { getBundlePath, getBundles } from '../../src/core'
import { getOutputName, sha256 } from '../../src/utils'

describe('getBundles', () => {
  it('sorts all supported HOS versions numerically, newest first', () => {
    expect(getBundles().map(bundle => bundle.labels.hos)).toEqual([
      '23.0.0',
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
  it.each([
    ['21.2.0', '1.10.2'],
    ['23.0.0', '1.12.0'],
  ])('uses numeric Atmosphere and HOS versions for %s', (hos, atmosphere) => {
    const bundle = getBundles().find(bundle => bundle.labels.hos === hos)!
    expect(getOutputName(bundle)).toBe(`atmosphere-${atmosphere}-hos-${hos}`)
  })
})
