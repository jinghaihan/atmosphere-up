import type { Resource } from './core/plan'
import type { TaskOptions } from './types'
import * as p from '@clack/prompts'
import { FIRMWARE_REPO } from './constants'
import { getRelease } from './download'
import { selectAsset } from './utils'

export async function promptFirmware(controller: AbortController, hos: string): Promise<boolean> {
  const enabled = await p.confirm({
    message: `download firmware for HOS ${hos}?`,
    signal: controller.signal,
  })

  if (p.isCancel(enabled)) {
    controller.abort()
    throw controller.signal.reason
  }

  return enabled
}

export async function resolveFirmware(hos: string, { signal, onProgress }: TaskOptions = {}): Promise<Resource> {
  onProgress?.(`resolving firmware (${hos})`)
  const release = await getRelease(FIRMWARE_REPO, hos, signal)

  return {
    module: 'firmware',
    release: release.tag_name,
    page: release.html_url,
    asset: selectAsset(release, /^Firmware\.[\d.]+\.zip$/),
    directory: `firmware/${hos}`,
  }
}
