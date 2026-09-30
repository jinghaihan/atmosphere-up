import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import type { CheatTool } from './cheats'
import type { SaveManager } from './save-management'
import { promptCheats, resolveCheats } from './cheats'
import { promptSaveManagement, resolveSaveManagement } from './save-management'

export * from './cheats'
export * from './save-management'

export interface ExtensionSelection {
  saveManager?: SaveManager
  cheats: CheatTool[]
}

export async function promptExtensions(controller: AbortController): Promise<ExtensionSelection> {
  const saveManager = await promptSaveManagement(controller)

  const cheats = await promptCheats(controller)

  return { saveManager, cheats }
}

export async function resolveExtensions({ saveManager, cheats }: ExtensionSelection, task: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  if (saveManager)
    resources.push(await resolveSaveManagement(saveManager, task))

  resources.push(...await resolveCheats(cheats, task))

  return resources
}
