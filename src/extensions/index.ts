import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import type { CheatTool } from './cheats'
import type { FileManager } from './file-management'
import type { SaveManager } from './save-management'
import { promptCheats, resolveCheats } from './cheats'
import { promptFileManagement, resolveFileManagement } from './file-management'
import { promptSaveManagement, resolveSaveManagement } from './save-management'

export * from './cheats'
export * from './file-management'
export * from './save-management'

export interface ExtensionSelection {
  saveManager?: SaveManager
  cheats: CheatTool[]
  fileManager?: FileManager
}

export async function promptExtensions(controller: AbortController): Promise<ExtensionSelection> {
  const saveManager = await promptSaveManagement(controller)

  const cheats = await promptCheats(controller)

  const fileManager = await promptFileManagement(controller)

  return { saveManager, cheats, fileManager }
}

export async function resolveExtensions({ saveManager, cheats, fileManager }: ExtensionSelection, task: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  if (saveManager)
    resources.push(await resolveSaveManagement(saveManager, task))

  resources.push(...await resolveCheats(cheats, task))

  if (fileManager)
    resources.push(await resolveFileManagement(fileManager, task))

  return resources
}
