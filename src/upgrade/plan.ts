import type { Bundle } from '../core'
import type { Module, TaskOptions } from '../types'
import { CORE_REPO_CONFIG } from '../constants'
import { resolveResources } from '../core'
import { resolveSelectedExtensions } from '../extensions'
import { resolveSaltyNx } from '../extensions/dependencies'

export interface UpgradeResourceOptions extends TaskOptions {
  bundle?: Bundle
}

export async function resolveUpgradeResources(modules: Module[], { bundle, ...task }: UpgradeResourceOptions = {}) {
  const core = modules.filter((module): module is keyof typeof CORE_REPO_CONFIG => module in CORE_REPO_CONFIG)
  const resources = await resolveResources(bundle, { ...task, modules: core })

  if (modules.includes('salty-nx'))
    resources.push(await resolveSaltyNx(task))

  resources.push(...await resolveSelectedExtensions(modules, { ...task, hos: bundle?.labels.hos, resources }))

  return resources
}
