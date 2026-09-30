import type { Options } from './types'
import pkg from '../package.json'

export const NAME = pkg.name

export const VERSION = pkg.version

export const DEFAULT_OPTIONS: Partial<Options> = {
  pack: false,
}

export const ULTRAHAND_KEY_COMBO = 'L+DDOWN'

/// keep-sorted
export const MODULE_REPO_CONFIG = {
  'atmosphere': 'Atmosphere-NX/Atmosphere',
  'dbi': 'rashevskyv/dbi',
  'hekate': 'CTCaer/hekate',
  'sys-patch': 'impeeza/sys-patch',
  'ultrahand': 'ppkantorski/Ultrahand-Overlay',
} as const

export const HEKATE_BOOT_CONFIG = new URL('./hekate_ipl.ini', import.meta.url)

export const PACK_DEFAULTS = new URL('./defaults/', import.meta.url)
