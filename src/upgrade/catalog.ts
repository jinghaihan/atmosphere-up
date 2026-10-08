import type { Option } from '@clack/prompts'
import type { ConfiguredExtension } from '../types'
import { CORE_MODULE_LABELS, CORE_REPO_CONFIG, EXTENSION_REPO_CONFIG } from '../constants'
import { getExtensionGroups } from '../extensions'
import { getRepositoryUrl } from '../utils'

export type ModuleOption = Option<string> & {
  label: string
  hint: string
}

export const MODULE_GROUPS: Record<string, ModuleOption[]> = {
  'Core Modules': [
    ...Object.entries(CORE_REPO_CONFIG).map(([value, repo]) => ({
      value: value as keyof typeof CORE_REPO_CONFIG,
      label: CORE_MODULE_LABELS[value as keyof typeof CORE_REPO_CONFIG],
      hint: getRepositoryUrl(repo),
    } as ModuleOption)),
    { value: 'sigpatches', label: 'Sigpatches', hint: 'bundled patches for the selected HOS version' },
  ],
  ...getExtensionGroups(),
  'Dependencies': [
    { value: 'salty-nx', label: 'SaltyNX', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['salty-nx']) },
  ],
}

export const MODULE_OPTIONS = Object.values(MODULE_GROUPS).flat()

export function getModuleGroups(extensions: ConfiguredExtension[] = []): Record<string, ModuleOption[]> {
  if (!extensions.length)
    return MODULE_GROUPS

  const names = new Set(MODULE_OPTIONS.map(option => option.value))

  for (const extension of extensions) {
    if (names.has(extension.name))
      throw new Error(`duplicate module name: ${extension.name}`)

    names.add(extension.name)
  }

  return {
    ...MODULE_GROUPS,
    'Configured Modules': extensions.map(extension => ({
      value: extension.name,
      label: extension.name,
      hint: getRepositoryUrl(extension.repository),
    })),
  }
}
