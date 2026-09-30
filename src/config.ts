import type { CommandOptions, ConfigOptions, Options } from './types'
import process from 'node:process'
import { dirname, resolve } from 'pathe'
import { createConfigLoader } from 'unconfig'
import { DEFAULT_OPTIONS } from './constants'

export async function readConfig(options: Partial<ConfigOptions>) {
  const loader = createConfigLoader<ConfigOptions>({
    sources: [
      {
        files: ['atmosphere-up.config'],
        extensions: ['ts', 'mts', 'js', 'mjs', 'json'],
      },
    ],
    cwd: options.cwd || process.cwd(),
    stopAt: dirname(resolve(options.cwd || process.cwd())),
    merge: false,
  })
  const config = await loader.load()
  return config.sources.length ? normalizeConfig(config.config) : {}
}

export async function resolveConfig(options: Partial<CommandOptions>): Promise<Options> {
  const defaults = structuredClone(DEFAULT_OPTIONS)
  options = normalizeConfig(options)

  const configOptions = await readConfig(options)
  const merged = { ...defaults, ...configOptions, ...options }
  const cwd = resolve(options.cwd || process.cwd())
  if (merged.output !== undefined && (typeof merged.output !== 'string' || !merged.output.trim()))
    throw new Error('Output must be a non-empty directory path.')

  return {
    ...merged,
    cwd,
    output: merged.output === undefined ? undefined : resolve(cwd, merged.output),
  }
}

function normalizeConfig(options: Partial<CommandOptions>) {
  if ('default' in options)
    options = options.default as Partial<CommandOptions>

  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
}
