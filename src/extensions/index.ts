import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import type { CheatTool } from './cheats'
import type { FileManager } from './file-management'
import type { PerformanceMonitor } from './performance-monitoring'
import type { PerformanceTool } from './performance-tuning'
import type { SaveManager } from './save-management'
import type { StreamingTool } from './streaming'
import { promptCheats, resolveCheats } from './cheats'
import { resolveSaltyNx } from './dependencies'
import { promptFileManagement, resolveFileManagement } from './file-management'
import { promptPerformanceMonitoring, resolvePerformanceMonitoring } from './performance-monitoring'
import { promptPerformanceTuning, resolvePerformanceTuning } from './performance-tuning'
import { promptSaveManagement, resolveSaveManagement } from './save-management'
import { promptStreaming, resolveStreaming } from './streaming'

export * from './cheats'
export * from './file-management'
export * from './performance-monitoring'
export * from './performance-tuning'
export * from './save-management'
export * from './streaming'

export interface ExtensionSelection {
  saveManager?: SaveManager
  cheats: CheatTool[]
  fileManager?: FileManager
  performance: PerformanceTool[]
  performanceMonitor?: PerformanceMonitor
  streaming: StreamingTool[]
}

export async function promptExtensions(controller: AbortController): Promise<ExtensionSelection> {
  const saveManager = await promptSaveManagement(controller)

  const cheats = await promptCheats(controller)

  const fileManager = await promptFileManagement(controller)

  const performance = await promptPerformanceTuning(controller)

  const performanceMonitor = await promptPerformanceMonitoring(controller)

  const streaming = await promptStreaming(controller)

  return { saveManager, cheats, fileManager, performance, performanceMonitor, streaming }
}

export async function resolveExtensions({ saveManager, cheats, fileManager, performance, performanceMonitor, streaming }: ExtensionSelection, task: TaskOptions = {}, atmosphere?: string): Promise<Resource[]> {
  const resources: Resource[] = []

  if (saveManager)
    resources.push(await resolveSaveManagement(saveManager, task))

  resources.push(...await resolveCheats(cheats, task))

  if (fileManager)
    resources.push(await resolveFileManagement(fileManager, task))

  resources.push(...await resolvePerformanceTuning(performance, task, atmosphere))

  if (performanceMonitor) {
    if (!resources.some(resource => resource.module === 'salty-nx'))
      resources.push(await resolveSaltyNx(task))

    resources.push(await resolvePerformanceMonitoring(performanceMonitor, task))
  }

  resources.push(...await resolveStreaming(streaming, task))

  return resources
}
