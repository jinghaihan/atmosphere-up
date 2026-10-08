import type { Bundle } from '../core'
import type { ExtensionContext } from '../extensions/types'
import type { ConfiguredExtension } from '../types'
import { CORE_REPO_CONFIG } from '../constants'
import { resolveResources } from '../core'
import { resolveConfiguredExtensions, resolveSelectedExtensions } from '../extensions'
import { resolveSaltyNx } from '../extensions/dependencies'

export interface UpgradeResourceOptions extends ExtensionContext {
  bundle?: Bundle
  extensions?: ConfiguredExtension[]
}

export async function resolveUpgradeResources(modules: string[], { bundle, extensions = [], ...task }: UpgradeResourceOptions = {}) {
  const core = modules.filter((module): module is keyof typeof CORE_REPO_CONFIG => module in CORE_REPO_CONFIG)
  const resources = await resolveResources(bundle, { ...task, modules: core })

  if (modules.includes('salty-nx'))
    resources.push(await resolveSaltyNx(task))

  resources.push(...await resolveSelectedExtensions(modules, { ...task, hos: bundle?.labels.hos, resources }))

  resources.push(...await resolveConfiguredExtensions(extensions.filter(extension => modules.includes(extension.name)), task))

  return resources
}
