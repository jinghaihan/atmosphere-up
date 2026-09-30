import type { Resource } from '../core/plan'
import type { Extension, ExtensionContext } from './types'
import * as p from '@clack/prompts'
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

function defineExtension<T extends string>({ prompt, resolve, ...option }: Extension<T>) {
  return {
    ...option,
    select: async (controller: AbortController): Promise<SelectedExtension> => {
      const modules = await prompt(controller)

      return { modules, resolve: context => resolve(modules, context) }
    },
  }
}

const extensions = [
  defineExtension({
    value: 'save-management',
    label: 'Save Management',
    initialSelected: true,
    prompt: promptSaveManagement,
    resolve: resolveSaveManagement,
  }),
  defineExtension({
    value: 'file-management',
    label: 'File Management',
    initialSelected: true,
    prompt: promptFileManagement,
    resolve: resolveFileManagement,
  }),
  defineExtension({
    value: 'cheats',
    label: 'Cheats',
    initialSelected: true,
    prompt: promptCheats,
    resolve: resolveCheats,
  }),
  defineExtension({
    value: 'performance-tuning',
    label: 'Performance Tuning',
    prompt: promptPerformanceTuning,
    resolve: resolvePerformanceTuning,
  }),
  defineExtension({
    value: 'performance-monitoring',
    label: 'Performance Monitoring',
    prompt: promptPerformanceMonitoring,
    resolve: resolvePerformanceMonitoring,
  }),
  defineExtension({
    value: 'controller-support',
    label: 'Controller Support',
    prompt: promptControllerSupport,
    resolve: resolveControllerSupport,
  }),
  defineExtension({
    value: 'streaming',
    label: 'Streaming',
    prompt: promptStreaming,
    resolve: resolveStreaming,
  }),
  defineExtension({
    value: 'amiibo',
    label: 'Amiibo',
    prompt: promptAmiibo,
    resolve: resolveAmiibo,
  }),
]

export async function promptExtensions(controller: AbortController): Promise<ExtensionSelection> {
  const categories = await p.multiselect({
    message: 'select extension categories',
    options: extensions.map(({ value, label }) => ({ value, label })),
    initialValues: extensions.filter(extension => extension.initialSelected).map(extension => extension.value),
    required: false,
    signal: controller.signal,
  })

  if (p.isCancel(categories)) {
    controller.abort()
    throw controller.signal.reason
  }

  const selection: ExtensionSelection = []

  for (const extension of extensions) {
    if (categories.includes(extension.value))
      selection.push(await extension.select(controller))
  }

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
