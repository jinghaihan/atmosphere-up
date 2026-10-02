import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'
import * as p from '@clack/prompts'
import { EXTENSION_REPO_CONFIG } from '../constants'
import { getRelease } from '../download'
import { getRepositoryUrl, selectAsset } from '../utils'

export type StreamingTool = 'moonlight-switch' | 'sys-dvr'

export const STREAMING_OPTIONS = [
  { value: 'moonlight-switch', label: 'Moonlight Switch', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['moonlight-switch']) },
  { value: 'sys-dvr', label: 'SysDVR', hint: getRepositoryUrl(EXTENSION_REPO_CONFIG['sys-dvr']) },
] satisfies { value: StreamingTool, label: string, hint: string }[]

export async function resolveStreaming(modules: StreamingTool[], { signal, onProgress }: TaskOptions = {}): Promise<Resource[]> {
  const resources: Resource[] = []

  for (const module of modules) {
    signal?.throwIfAborted()

    onProgress?.(`resolving ${module} (latest)`)
    const release = await getRelease(EXTENSION_REPO_CONFIG[module], undefined, signal)

    resources.push({
      module,
      release: release.tag_name,
      page: release.html_url,
      asset: selectAsset(release, module === 'moonlight-switch' ? /^Moonlight-Switch\.nro$/ : /^SysDVR\.zip$/),
      target: module === 'moonlight-switch' ? 'switch/Moonlight-Switch/Moonlight-Switch.nro' : undefined,
    })
  }

  return resources
}

export async function promptStreaming(controller: AbortController): Promise<StreamingTool[]> {
  const modules = await p.multiselect<StreamingTool>({
    message: 'select streaming tools',
    initialValues: ['moonlight-switch', 'sys-dvr'],
    signal: controller.signal,
    options: STREAMING_OPTIONS,
  })

  if (p.isCancel(modules)) {
    controller.abort()
    throw controller.signal.reason
  }

  return modules
}
