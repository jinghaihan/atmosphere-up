import { describe, expect, it } from 'vitest'
import { getBundles } from '../src/core'
import { getOutputPath } from '../src/utils'

describe('getOutputPath', () => {
  it('creates a named directory or ZIP inside the output parent', () => {
    const bundle = getBundles().find(bundle => bundle.labels.hos === '21.2.0')!
    expect(getOutputPath(bundle, '/packs')).toBe('/packs/atmosphere-1.10.2-hos-21.2.0')
    expect(getOutputPath(bundle, '/packs', true)).toBe('/packs/atmosphere-1.10.2-hos-21.2.0.zip')
  })
})
