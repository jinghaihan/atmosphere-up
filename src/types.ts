import type { RestEndpointMethodTypes } from '@octokit/rest'
import type { MODE_CHOICES } from './constants'

export type Mode = typeof MODE_CHOICES[number]

export interface ConfiguredExtensionAsset {
  name: string | RegExp
  target?: string
  directory?: string
}

export interface ConfiguredExtension {
  name: string
  repository: string
  releaseTag?: string
  assets: ConfiguredExtensionAsset[]
}

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

export interface ConfigOptions extends CommandOptions {
  extra?: string
  extensions?: ConfiguredExtension[]
}

export interface Options extends CommandOptions, ConfigOptions {}

export interface TaskOptions {
  signal?: AbortSignal
  onProgress?: (message: string) => void
}

export type Release = RestEndpointMethodTypes['repos']['getReleaseByTag']['response']['data']
export type ReleaseAsset = Release['assets'][number]
