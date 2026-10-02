import type { RestEndpointMethodTypes } from '@octokit/rest'
import type { CORE_REPO_CONFIG, EXTENSION_REPO_CONFIG, MODE_CHOICES } from './constants'

export type Mode = typeof MODE_CHOICES[number]

export type Module = keyof typeof CORE_REPO_CONFIG | keyof typeof EXTENSION_REPO_CONFIG | 'sigpatches'

export interface CommandOptions {
  mode?: Mode
  modules?: string[]
  cwd?: string
  version?: string
  output?: string
  ext?: boolean
  firmware?: boolean
  pack?: boolean
}

export interface ConfigOptions extends CommandOptions {}

export interface Options extends CommandOptions, ConfigOptions {}

export interface TaskOptions {
  signal?: AbortSignal
  onProgress?: (message: string) => void
}

export type Release = RestEndpointMethodTypes['repos']['getReleaseByTag']['response']['data']
export type ReleaseAsset = Release['assets'][number]
