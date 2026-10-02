import * as p from '@clack/prompts'
import c from 'ansis'
import tildify from 'tildify'
import { getBundles, inspectOutput } from '../core'

export async function promptBundle(version?: string, signal?: AbortSignal) {
  const bundles = getBundles()

  if (version !== undefined) {
    const bundle = bundles.find(bundle => bundle.labels.hos === version)
    if (!bundle)
      throw new Error(`unsupported HOS version: ${version}`)

    return bundle
  }

  return p.select({
    message: 'select HOS version',
    options: bundles.map(bundle => ({
      value: bundle,
      label: bundle.labels.hos,
      hint: bundle.labels.hos === '23.0.0'
        ? `atmosphere ${bundle.labels.atmosphere} · ${c.red('high risk')}`
        : `atmosphere ${bundle.labels.atmosphere}`,
    })),
    initialValue: bundles[0],
    signal,
  })
}

export async function confirmOutput(destination: string, cwd: string): Promise<boolean | undefined> {
  const replace = inspectOutput(destination, cwd)

  if (replace) {
    const confirmed = await p.confirm({
      message: `output already exists: ${c.cyan(tildify(destination))}. replace it?`,
      initialValue: false,
    })

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('aborting')
      return
    }
  }

  return replace
}
