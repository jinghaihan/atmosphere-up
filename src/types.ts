export interface CommandOptions {
  cwd?: string
  output?: string
}

export interface ConfigOptions extends CommandOptions {}

export interface Options extends CommandOptions, ConfigOptions {}
