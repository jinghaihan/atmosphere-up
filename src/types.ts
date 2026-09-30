import type { RestEndpointMethodTypes } from '@octokit/rest'

export interface CommandOptions {
  cwd?: string
  output?: string
  pack?: boolean
}

export interface ConfigOptions extends CommandOptions {}

export interface Options extends CommandOptions, ConfigOptions {}

export type Release = RestEndpointMethodTypes['repos']['getReleaseByTag']['response']['data']
export type ReleaseAsset = Release['assets'][number]
