import type { Options } from './types'
import pkg from '../package.json'

export const NAME = pkg.name

export const VERSION = pkg.version

export const DEFAULT_OPTIONS: Partial<Options> = {
  ext: true,
  pack: false,
}

/// keep-sorted
export const CORE_REPO_CONFIG = {
  'atmosphere': 'Atmosphere-NX/Atmosphere',
  'dbi': 'rashevskyv/dbi',
  'hekate': 'CTCaer/hekate',
  'lockpick-rcm': 'impeeza/Lockpick_RCMDecScots',
  'ovl-sysmodules': 'ppkantorski/ovl-sysmodules',
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
  'fps-locker': 'masagrator/FPSLocker',
  'horizon-oc': 'Horizon-OC/Horizon-OC',
  'jksv': 'J-D-K/JKSV',
  'nx-shell': 'DefenderOfHyrule/NX-Shell',
  'reverse-nx-rt': 'masagrator/ReverseNX-RT',
  'salty-nx': 'masagrator/SaltyNX',
  'status-monitor-deux': 'masagrator/Status-Monitor-Deux',
  'status-monitor': 'ppkantorski/Status-Monitor-Overlay',
  'sys-clk-ultrahand-overlay': 'ppkantorski/sys-clk',
  'sys-clk': 'retronx-team/sys-clk',
} as const

export const PACK_DEFAULTS = new URL('../assets/defaults/', import.meta.url)
