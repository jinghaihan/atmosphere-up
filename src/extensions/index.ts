import type { Resource } from '../core/plan'
import type { Extension, ExtensionContext } from './types'
import { promptAmiibo, resolveAmiibo } from './amiibo'
import { promptCheats, resolveCheats } from './cheats'
import { promptControllerSupport, resolveControllerSupport } from './controller-support'
import { promptFileManagement, resolveFileManagement } from './file-management'
import { promptPerformanceMonitoring, resolvePerformanceMonitoring } from './performance-monitoring'
import { promptPerformanceTuning, resolvePerformanceTuning } from './performance-tuning'
import { promptSaveManagement, resolveSaveManagement } from './save-management'
import { promptStreaming, resolveStreaming } from './streaming'

export * from './amiibo'
export * from './cheats'
export * from './controller-support'
export * from './file-management'
export * from './performance-monitoring'
export * from './performance-tuning'
export * from './save-management'
export * from './streaming'

export interface SelectedExtension {
  modules: string[]
  resolve: (context: ExtensionContext) => Promise<Resource[]>
}

export type ExtensionSelection = SelectedExtension[]

function defineExtension<T extends string>({ prompt, resolve }: Extension<T>) {
  return async (controller: AbortController): Promise<SelectedExtension> => {
    const modules = await prompt(controller)

    return { modules, resolve: context => resolve(modules, context) }
  }
}

const extensions = [
  defineExtension({ prompt: promptSaveManagement, resolve: resolveSaveManagement }),
  defineExtension({ prompt: promptFileManagement, resolve: resolveFileManagement }),
  defineExtension({ prompt: promptCheats, resolve: resolveCheats }),
  defineExtension({ prompt: promptPerformanceTuning, resolve: resolvePerformanceTuning }),
  defineExtension({ prompt: promptPerformanceMonitoring, resolve: resolvePerformanceMonitoring }),
  defineExtension({ prompt: promptControllerSupport, resolve: resolveControllerSupport }),
  defineExtension({ prompt: promptStreaming, resolve: resolveStreaming }),
  defineExtension({ prompt: promptAmiibo, resolve: resolveAmiibo }),
]

export async function promptExtensions(controller: AbortController): Promise<ExtensionSelection> {
  const selection: ExtensionSelection = []

  for (const extension of extensions)
    selection.push(await extension(controller))

  return selection
}

export async function resolveExtensions(selection: ExtensionSelection, context: ExtensionContext = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const extension of selection) {
    if (extension.modules.length)
      resources.push(...await extension.resolve({ ...context, resources: [...resources] }))
  }

  return resources
}
