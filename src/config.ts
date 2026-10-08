import type { CommandOptions, ConfigOptions, Options } from './types'
import { existsSync, statSync } from 'node:fs'
import process from 'node:process'
import { dirname, resolve } from 'pathe'
import tildify from 'tildify'
import { createConfigLoader } from 'unconfig'
import { DEFAULT_OPTIONS, MODE_CHOICES } from './constants'
import { getModuleGroups } from './upgrade/catalog'

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

  getModuleGroups(merged.extensions)

  if (!MODE_CHOICES.includes(merged.mode!))
    throw new Error(`invalid mode: ${merged.mode}. please use one of the following: ${MODE_CHOICES.join(', ')}`)

  if (merged.output !== undefined && (typeof merged.output !== 'string' || !merged.output.trim()))
    throw new Error('Output must be a non-empty directory path.')

  if (merged.extra !== undefined && (typeof merged.extra !== 'string' || !merged.extra.trim()))
    throw new Error('extra must be a non-empty directory path.')

  const extra = merged.extra === undefined ? undefined : resolve(cwd, merged.extra)

  if (extra && (!existsSync(extra) || !statSync(extra).isDirectory()))
    throw new Error(`extra must be an existing directory: ${tildify(extra)}`)

  return {
    ...merged,
    cwd,
    output: merged.output === undefined ? undefined : resolve(cwd, merged.output),
    extra,
  }
}

function normalizeConfig(options: Partial<ConfigOptions>) {
  if ('default' in options)
    options = options.default as Partial<ConfigOptions>

  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
}
