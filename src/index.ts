import type { ConfigOptions } from './types'

export type { CommandOptions, ConfigOptions, ConfiguredExtension, ConfiguredExtensionAsset, Options } from './types'

export function defineConfig(config: Partial<ConfigOptions>) {
  return config
}
