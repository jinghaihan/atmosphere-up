import type { Resource } from '../core/plan'
import type { ExtensionContext } from './types'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import { parse, stringify } from 'ini'
import { dirname, join } from 'pathe'
import { EXTENSION_REPO_CONFIG, PACK_DEFAULTS } from '../constants'
import { getRelease } from '../download'
import { getRepositoryUrl, selectAsset } from '../utils'

export type CheatTool = 'edizon-overlay' | 'edizon-se' | 'breeze' | 'breezehand'

export interface CheatSettings {
  enabledByDefault: boolean
  rememberToggles: boolean
}

export const CHEAT_OPTIONS = [
  { value: 'edizon-overlay', label: 'EdiZon Overlay', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['edizon-overlay']) },
  { value: 'edizon-se', label: 'EdiZon SE', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['edizon-se']) },
  { value: 'breeze', label: 'Breeze', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG.breeze) },
  { value: 'breezehand', label: 'Breezehand Overlay', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG.breezehand) },
] satisfies { value: CheatTool, label: string, hint: string }[]

export async function resolveCheats(modules: CheatTool[], { signal, onProgress, cheats }: ExtensionContext = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const module of modules) {
    signal?.throwIfAborted()

    onProgress?.(`resolving ${module} (latest)`)
    const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)
    const resource = (pattern: RegExp, options: Pick<Resource, 'target' | 'paths'> = {}): Resource => ({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset: selectAsset(release, pattern),
      ...options,
    })

    switch (module) {
      case 'edizon-overlay':
        resources.push(resource(/^ovlEdiZon\.ovl$/, { target: 'switch/.overlays/ovlEdiZon.ovl' }))
        break
      case 'edizon-se':
        resources.push(resource(/^edizon\.zip$/, { paths: ['switch/edizon/'] }))
        break
      case 'breeze':
        resources.push(resource(/^Breeze\.zip$/, { paths: ['switch/breeze/'] }))
        break
      case 'breezehand':
        resources.push(resource(/^breezehand\.zip$/, { paths: ['switch/.overlays/breezehand.ovl', 'config/breezehand/'] }))
        break
    }
  }

  if (cheats && resources.length)
    resources[resources.length - 1].configure = directory => applyCheatSettings(directory, cheats)

  return resources
}

export async function promptCheatSettings(controller: AbortController): Promise<CheatSettings> {
  const enabledByDefault = await p.confirm({
    message: 'enable cheats by default?',
    initialValue: false,
    signal: controller.signal,
  })

  if (p.isCancel(enabledByDefault)) {
    controller.abort()
    throw controller.signal.reason
  }

  const rememberToggles = await p.confirm({
    message: 'remember cheat toggles?',
    initialValue: false,
    signal: controller.signal,
  })

  if (p.isCancel(rememberToggles)) {
    controller.abort()
    throw controller.signal.reason
  }

  return { enabledByDefault, rememberToggles }
}

async function applyCheatSettings(directory: string, { enabledByDefault, rememberToggles }: CheatSettings): Promise<void> {
  const path = join(directory, 'atmosphere/config/system_settings.ini')
  const source = existsSync(path) ? path : new URL('atmosphere/config/system_settings.ini', PACK_DEFAULTS)
  const settings = parse(await readFile(source, 'utf8'))

  settings.atmosphere ??= {}
  settings.atmosphere.dmnt_cheats_enabled_by_default = enabledByDefault ? 'u8!0x1' : 'u8!0x0'
  settings.atmosphere.dmnt_always_save_cheat_toggles = rememberToggles ? 'u8!0x1' : 'u8!0x0'

  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, stringify(settings, { whitespace: true }))
}

export async function promptCheats(controller: AbortController): Promise<CheatTool[]> {
  const modules = await p.multiselect<CheatTool>({
    message: 'select cheat tools',
    initialValues: ['edizon-overlay'],
    signal: controller.signal,
    options: CHEAT_OPTIONS,
  })

  if (p.isCancel(modules)) {
    controller.abort()
    throw controller.signal.reason
  }

  return modules
}
