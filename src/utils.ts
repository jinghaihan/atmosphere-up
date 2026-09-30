import type { Bundle } from './core/catalog'
import { isAbsolute, relative } from 'pathe'

export function isParentDirectory(parent: string, child: string): boolean {
  const path = relative(parent, child)
  return !path || (!isAbsolute(path) && path !== '..' && !path.startsWith('../'))
}

export function getOutputName(bundle: Bundle): string {
  return `atmosphere-${bundle.labels.atmosphere}-hos-${bundle.labels.hos}`
}
