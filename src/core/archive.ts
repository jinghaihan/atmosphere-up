import { Buffer } from 'node:buffer'
import { Open } from 'unzipper'

export async function extractArchive(data: Uint8Array, directory: string): Promise<void> {
  const archive = await Open.buffer(Buffer.from(data))
  await archive.extract({ path: directory })
}
