import type { Options } from './types'
import pkg from '../package.json'

export const NAME = pkg.name

export const VERSION = pkg.version

export const DEFAULT_OPTIONS: Partial<Options> = {
  pack: false,
}

/// keep-sorted
export const CORE_REPO_CONFIG = {
  'atmosphere': 'Atmosphere-NX/Atmosphere',
  'dbi': 'rashevskyv/dbi',
  'hekate': 'CTCaer/hekate',
  'lockpick-rcm': 'impeeza/Lockpick_RCMDecScots',
  'sys-patch': 'impeeza/sys-patch',
  'ultrahand': 'ppkantorski/Ultrahand-Overlay',
} as const

/// keep-sorted
export const EXTENSION_REPO_CONFIG = {
  'breeze': 'tomvita/Breeze-Beta',
  'breezehand': 'tomvita/Breezehand-Overlay',
  'checkpoint': 'BernardoGiordano/Checkpoint',
  'edizon-overlay': 'proferabg/EdiZon-Overlay',
  'edizon-se': 'tomvita/EdiZon-SE',
  'jksv': 'J-D-K/JKSV',
} as const

export const PACK_DEFAULTS = new URL('./defaults/', import.meta.url)
