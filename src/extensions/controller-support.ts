import type { Resource } from '../core/plan'
import type { ExtensionContext } from './types'
import * as p from '@clack/prompts'
import versions from '../../assets/mission-control/versions.json'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { getRepositoryUrl, selectAsset } from '../utils'

export type ControllerTool = 'mission-control' | 'sys-con'

export async function promptControllerSupport(controller: AbortController): Promise<ControllerTool[]> {
  const modules = await p.multiselect<ControllerTool>({
    message: 'select controller tools',
    initialValues: ['mission-control', 'sys-con'],
    signal: controller.signal,
    options: [
      { value: 'mission-control', label: 'Mission Control', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['mission-control']) },
      { value: 'sys-con', label: 'Sys Con', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['sys-con']) },
    ],
  })

  if (p.isCancel(modules)) {
    controller.abort()
    throw controller.signal.reason
  }

  return modules
}

export async function resolveControllerSupport(modules: ControllerTool[], { signal, onProgress, hos }: ExtensionContext = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const module of modules) {
    signal?.throwIfAborted()

    const tag = module === 'mission-control' ? (versions as Record<string, string>)[hos || ''] : undefined
    if (module === 'mission-control' && !tag)
      throw new Error(`no Mission Control release configured for HOS ${hos}`)

    onProgress?.(`resolving ${module} (${tag || 'latest'})`)
    const release = await getRelease(EXTENSION_REPO_CONFIG[module], tag, signal)

    resources.push({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset: selectAsset(release, module === 'mission-control' ? /^MissionControl-.*\.zip$/ : /^sys-con-.*\.zip$/),
    })
  }

  return resources
}
