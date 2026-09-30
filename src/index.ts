import type { ConfigOptions } from './types'

export type { CommandOptions, ConfigOptions, Options } from './types'

export function defineConfig(config: Partial<ConfigOptions>) {
  return config
}
