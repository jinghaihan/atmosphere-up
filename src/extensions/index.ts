import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import type { CheatTool } from './cheats'
import type { FileManager } from './file-management'
import type { PerformanceTool } from './performance-tuning'
import type { SaveManager } from './save-management'
import { promptCheats, resolveCheats } from './cheats'
import { promptFileManagement, resolveFileManagement } from './file-management'
import { promptPerformanceTuning, resolvePerformanceTuning } from './performance-tuning'
import { promptSaveManagement, resolveSaveManagement } from './save-management'

export * from './cheats'
export * from './file-management'
export * from './performance-tuning'
export * from './save-management'

export interface ExtensionSelection {
  saveManager?: SaveManager
  cheats: CheatTool[]
  fileManager?: FileManager
  performance: PerformanceTool[]
}

export async function promptExtensions(controller: AbortController): Promise<ExtensionSelection> {
  const saveManager = await promptSaveManagement(controller)

  const cheats = await promptCheats(controller)

  const fileManager = await promptFileManagement(controller)

  const performance = await promptPerformanceTuning(controller)

  return { saveManager, cheats, fileManager, performance }
}

export async function resolveExtensions({ saveManager, cheats, fileManager, performance }: ExtensionSelection, task: TaskOptions = {}, atmosphere?: string): Promise<Resource[]> {
  const resources: Resource[] = []

  if (saveManager)
    resources.push(await resolveSaveManagement(saveManager, task))

  resources.push(...await resolveCheats(cheats, task))

  if (fileManager)
    resources.push(await resolveFileManagement(fileManager, task))

  resources.push(...await resolvePerformanceTuning(performance, task, atmosphere))

  return resources
}
