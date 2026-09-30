import type { Options } from './types'
import pkg from '../package.json'

export const NAME = pkg.name

export const VERSION = pkg.version

export const DEFAULT_OPTIONS: Partial<Options> = {
  pack: false,
}

/// keep-sorted
export const MODULE_REPO_CONFIG = {
  'atmosphere': 'Atmosphere-NX/Atmosphere',
  'dbi': 'rashevskyv/dbi',
  'hekate': 'CTCaer/hekate',
  'sys-patch': 'impeeza/sys-patch',
  'ultrahand': 'ppkantorski/Ultrahand-Overlay',
} as const

export const HEKATE_BOOT_CONFIG = `[config]
autoboot=0
bootwait=3

[CFW emuMMC]
pkg3=atmosphere/package3
kip1patch=nosigchk
emummcforce=1

[CFW sysMMC]
pkg3=atmosphere/package3
kip1patch=nosigchk
emummc_force_disable=1

[Stock sysMMC]
pkg3=atmosphere/package3
stock=1
emummc_force_disable=1
\n`
