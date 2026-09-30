import type { SaveManager } from '../extensions'
import * as p from '@clack/prompts'
import { EXTENSION_REPO_CONFIG } from '../constants'

export async function promptSaveManagement(controller: AbortController): Promise<SaveManager | undefined> {
  const enabled = await p.confirm({
    message: 'include save management?',
    signal: controller.signal,
  })

  if (p.isCancel(enabled)) {
    controller.abort()
    throw controller.signal.reason
  }

  if (!enabled)
    return undefined

  const module = await p.select<SaveManager>({
    message: 'select save manager',
    initialValue: 'jksv',
    signal: controller.signal,
    options: [
      { value: 'jksv', label: 'JKSV', hint: `https://github.com/${EXTENSION_REPO_CONFIG.jksv}` },
      { value: 'checkpoint', label: 'Checkpoint', hint: `https://github.com/${EXTENSION_REPO_CONFIG.checkpoint}` },
    ],
  })

  if (p.isCancel(module)) {
    controller.abort()
    throw controller.signal.reason
  }

  return module
}
