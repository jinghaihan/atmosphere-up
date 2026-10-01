import type { Resource } from '../core/plan'
import type { TaskOptions } from '../types'

export interface ExtensionContext extends TaskOptions {
  hos?: string
  resources?: Resource[]
}

export interface Extension<T extends string> {
  value: string
  label: string
  initialSelected?: boolean
  prompt: (controller: AbortController) => Promise<T[]>
  resolve: (modules: T[], context?: ExtensionContext) => Promise<Resource[]>
}
