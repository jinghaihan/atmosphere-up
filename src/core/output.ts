import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'pathe'
import { isParentDirectory } from '../utils'

export function inspectOutput(directory: string, cwd: string): boolean {
  if (isParentDirectory(resolve(directory), resolve(cwd)))
    throw new Error('Output cannot be the working directory or one of its parents.')
  return existsSync(directory)
}

export async function writeOutput(directory: string, replace: boolean, populate: (staging: string) => Promise<void>): Promise<void> {
  await mkdir(dirname(directory), { recursive: true })
  const staging = await mkdtemp(join(dirname(directory), '.atmosphere-up-'))
  try {
    await populate(staging)
    if (replace)
      await rm(directory, { recursive: true, force: true })
    await rename(staging, directory)
  }
  finally {
    await rm(staging, { recursive: true, force: true })
  }
}
