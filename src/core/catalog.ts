import { globSync } from 'tinyglobby'
import { compare } from 'verkit'
import manifest from '../../assets/sigpatches/manifest.json'

export type Bundle = typeof manifest.bundles[number]

export function getBundles(): Bundle[] {
  return [...manifest.bundles].sort((a, b) => compare(b.labels.hos, a.labels.hos))
}

export function getBundlePath(bundle: Bundle): string {
  const [path] = globSync([
    `../assets/sigpatches/${bundle.file}`,
    `../../assets/sigpatches/${bundle.file}`,
  ], { cwd: new URL('.', import.meta.url), absolute: true, expandDirectories: false })
  if (path)
    return path
  throw new Error('Bundled sigpatch resources are missing. Reinstall atmosphere-up.')
}
