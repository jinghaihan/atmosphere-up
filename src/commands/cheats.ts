import type { CheatTool } from '../extensions'
import * as p from '@clack/prompts'
import { EXTENSION_REPO_CONFIG } from '../constants'

export async function promptCheats(controller: AbortController): Promise<CheatTool[]> {
  const enabled = await p.confirm({
    message: 'include cheats?',
    signal: controller.signal,
  })

  if (p.isCancel(enabled)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (!enabled)
    return []

  const modules = await p.multiselect<CheatTool>({
    message: 'select cheat tools',
    initialValues: ['edizon-overlay'],
    signal: controller.signal,
    options: [
      { value: 'edizon-overlay', label: 'EdiZon Overlay', hint: `https://github.com/${EXTENSION_REPO_CONFIG['edizon-overlay']}` },
      { value: 'edizon-se', label: 'EdiZon SE', hint: `https://github.com/${EXTENSION_REPO_CONFIG['edizon-se']}` },
      { value: 'breeze', label: 'Breeze', hint: `https://github.com/${EXTENSION_REPO_CONFIG.breeze}` },
      { value: 'breezehand', label: 'Breezehand Overlay', hint: `https://github.com/${EXTENSION_REPO_CONFIG.breezehand}` },
    ],
  })

  if (p.isCancel(modules)) {
    controller.abort()
    throw controller.signal.reason
  }

  return modules
}
