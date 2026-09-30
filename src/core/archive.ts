import { Buffer } from 'node:buffer'
import AdmZip from 'adm-zip'

export async function extractArchive(data: Uint8Array, directory: string, paths?: string[]): Promise<void> {
  const archive = new AdmZip(Buffer.from(data))

  if (paths) {
    for (const path of paths)
      archive.extractEntryTo(path, directory, true, true)

    return
  }

  await archive.extractAllToAsync(directory, true)
}

export async function compressArchive(directory: string, destination: string): Promise<void> {
  const archive = new AdmZip()
  await archive.addLocalFolderPromise(directory)
  await archive.writeZipPromise(destination)
}
