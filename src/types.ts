import type { CORE_MODULES } from './constants'

export interface CommandOptions {
  cwd?: string
}

export interface ConfigOptions extends CommandOptions {}

export interface Options extends CommandOptions, ConfigOptions {}

export type CoreModule = (typeof CORE_MODULES)[number]

export interface OSConfig {
  version: string
  modules: Record<CoreModule | string, string>
}

export interface ModuleConfig {
  repository: string
  tag: string
  file: string | RegExp
}
